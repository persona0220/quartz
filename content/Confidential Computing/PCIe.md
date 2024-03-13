---
date: 2024-03-05T14:30
lastmod: 2024-03-13T05:29
---

# What is PCIe?
- PCIe (Peripheral Component Interconnect Express) is a high-speed serial computer expansion bus standard used for connecting hardware components to the motherboard.
- Most cloud deployments use PCIe to connect powerful CPU cores to dedicated accelerators. This offers the flexibility to plug in the best-suited devices after procurement as well as the scalability to connect 16-64 devices per node. The bus-level access control mechanisms, such as Arm TrustZone or RISC-V PMP, do not extend to such devices. [^ACAI] 

## What is IDE?
- Integrity and Data Encryption (IDE) provides **confidentiality** and **integrity** guarantees for PCIe packets.
- ==Hardware encryption== can be leveraged to build a performant design without software-based encryption.
	- [p] With device-accessible realm memory with HW encryption on both CPU and accelerators, it removes the need for multiple data copies and software-based encryption-decryption.
	- [!] Not designed for untrusted hypervisor
- each PCIe link per device has a unique key which is used for data protection.


# Using PCIe device for CC

> [!tldr] 
> 1. The device hardware needs to support ==IDE== for secure communication.
> 2. The device firmware needs to support ==SPDM== for device attestation and secure session establishment.
> 3. The device firmware needs to support ==TDISP== for device interface management.

## Challenges
- How TVM communicates with device?
- How TVM trusts the device?
- How TVM manages the device?
- What are the security requirements for the TVM compatible device?

![[Pasted image 20240313024826.png]]


## TEE-IO device secure communication
Since the VMM is not trusted, the communication between TVM and the device must be protected.

### Software mechanism
Reuse the network TLS to establish a session between TVM and device, similar to today's bounce-buffer solution. 
- [c] Since all communication data need to be encrypted by the software, there might be performance issue.

> [!fail]- (SW mechanism) Bounce-buffer design for encrypted communication
>```mermaid
> sequenceDiagram
> participant VM
> participant A as Accelerator
> activate VM
> Note over VM: encrypts the data buffer<br/>in software
> deactivate VM
> VM->>A: sends encrypted data
> activate A
> Note over A: decrypts using<br/>accelerator-specific logic
> deactivate A
> activate A
> Note over A: generate results
> Note over A: encrypt result
> deactivate A
> A->>VM: transfer encrypted result to<br/>publicly accessible part<br/> of the CPU memory
> activate VM
> Note over VM: Copy the encrypted data<br/> into its own protected memory
> Note over VM: decrypt it
> ```
>- [c] Two extra copies and software-based encryption and integrity protection on both the processors and peripherals **-> Increasing memory and compute overhead**
>- [c] requires invasive API changes in the applications, drivers to perform encryption, and the device-side logic for encryption **-> Break compatibility**

### Hardware mechanism
![[Pasted image 20240313031728.png]]

| Abbreviations | Meaning                                |
| ------------- | -------------------------------------- |
| TVM           | Trusted Execution Environment          |
| TSM           | TEE Security Manager                   |
| DSM           | Device Security Manager                |
| SPDM          | Security Protocol and Data Model       |
| IDE           | PCIe/CXL Integrity and Data Encryption |
| IDE_KM        | IDE Key Management                     |
| TLP           | PCI Transaction Layer Packet           |

> [!example] Steps for HW mechanism
> 1. TSM on the host side establishes secure session with the device using **SPDM**.
> 2. SPDM is a software communication mechanism which transports the management data only but not the workload. By using SPDM protocol, the TSM and DSM can use a IDE Key Management protocol (IDE_KM) to negotiate a set of IDE keys (purple keys in the figure).
> 3. TSM and DSM configures the encryption key (enc_key) for the device hardware such as PCIe Root Port
> 4. After those keys are configured, the IDE keys are used for hardware encryption. 
> 5. The PCIe transactions between the device and host SoC will be encrypted by the IDE keys (link encryption).


## TEE-IO device attestation

TVM need a way to verify the device to ensure it's the right device using attestation.

![[Pasted image 20240313034427.png]]

| Abbreviations | Meaning                              |
| ------------- | ------------------------------------ |
| SVN           | Security Version Number              |
| RIM           | Reference Integrity Manifest         |
| SWID          | Software Identification Tag          |
| CoRIM         | Concise Reference Integrity Manifest |
| DICE          | Device Identity Composition Engine   |

> [!example] Steps for attestation
> 1. The SPDM protocol defines a standard mechanism to allow the device transport the device certificate chain and the *device measurement*, version and SVN to the host.
> 	- Device certificate chain may include a *root CA*, *intermediate CA* and *device certificate*. [^Cert]
> 
>    [^Cert]: [SPDM Spec 1.3.0.pdf#7.2.1](https://www.dmtf.org/sites/default/files/standards/documents/DSP0274_1.3.0.pdf)
> 
> 	- Device measurement may include the digest of ROM, hardware configuration, firmware configuration, version, SVN and device state such as debug mode or recovery mode. [^measurement]
> 
> [^measurement]: [SPDM Spec 1.3.0.pdf#Figure28](https://www.dmtf.org/sites/default/files/standards/documents/DSP0274_1.3.0.pdf)
> 
> 2. Host side TSM acts as attester to collect the device certificate and measurement and pass to the TVM. 
> 3. To verify the data, TVM needs to get the endorsement from the endorser and the reference integrity manifest from RIM provider, and policy from policy provider.
> 	- The endorser could be the device vendor or the OEM. The endorsement could be a root CA cert which can be used to verify the device certificate chain.
> 	- The device vendor can also provide the RIM, which is the expected device measurement. TVM compares the RIM from RIM provider with the measurement received from TSM.
> 	- In real world, the policy could be flexible. For example, the appraising policy could claim that it can trust the device as long as the SVN is the latest one. Then, the TVM just compares the SVN collected from the device with the SVN provided from the RIM. The rest of measurement such as digest or firmware can be ignored.
> 

## TEE-IO device management

![[Pasted image 20240313043335.png]]

| Abbreviations | Meaning                                |
| ------------- | -------------------------------------- |
| TDI           | TEE Device Interface                   |
| TDISP         | TEE Device Interface Security Protocol |
|               |                                        |

### Management channel (TDISP)
- The PCIe 6.0 defined the [[TDISP]], stands for TEE Device Interface Security Protocol.
- The TDISP message is a management message, protected by SPDM session.
> [!example] IO device management steps
> 1. Once TSM and DSM configure IDE key, VMM sends TDISP `lock` interface to DSM.
> 2. DSM locks down the TDI configuration and change its state to `locked`.
> 3. TVM now starts use the device, using trusted DMA/MMIO 
> 4. TVM use TDISP to manage TDI, via TSM and DSM. 

### Data channel (IDE)
- Trusted DMA/MMIO between TVM and the device is protected by IDE TLP. 

### Device-TVM mapping
The device side TDI is assignable portion of the device. It's a logical component. The device vendors determine which mode to support.
- It could be a whole physical device, then the whole physical device is managed by a TVM.
- A TDI could be device's physical function and a TVM owns that specific physical device function.
- A TDI could be device's virtual function such as single root I/O Virtualization (SR-IOV), then a TVM holds just the virtual function.


## TEE-IO device security requirement

### Device TCB for TEE 
- The device's TCB for TEE is a DSM and the hardware, where the DSM acts as a security policy enforcer.
- DSM needs to support the SPDM secure session to communicate with the host side TSM. 
- DSM should support a function isolation, for example, the isolation between the TDIs.
- DSM should support resource isolation to ensure no private resources can be accessed by two TDIs.
- DSM should support resource lock. Once the host sends lock interface, no configuration change can be done for TDIs.

### Device root of trust (RoT)
- The device root of trust (RoT) will take the responsibility to manage the firmware. For example, in order to support device attestation, the device RoT should define the RoT for measurement, storage, and reporting. The RoT needs to ensure that no one can forge the device measurement.
- RoT supports resiliency. For example, secure boot, secure firmware update and recovery.


## Put things together

![[Pasted image 20240313052036.png]]

![[Pasted image 20240313054843.png]]

![[Pasted image 20240313054855.png]]


# References
- [Making PCI devices Ready for Confidential Computing, OC3, Youtube](https://www.youtube.com/watch?v=nWl4Gh1nTkI)
- [Making PCI devices Ready for Confidential Computing, OC3, Slides](https://uploads-ssl.webflow.com/63c54a346e01f30e726f97cf/6418ef27a6f5381ce3b00b25_OC3%20-%202023%20Making%20PCI%20Devices%20Ready%20for%20Confidential%20Computing%20v2.pdf)
- [SPDM Spec 1.3.0.pdf](https://www.dmtf.org/sites/default/files/standards/documents/DSP0274_1.3.0.pdf)
- [[whitepaper-tee-io-device-guide-v0-6-5.pdf]]

[^ACAI]: [ACAI: Protecting Accelerator Execution with Arm Confidential Computing Architecture | USENIX](https://www.usenix.org/conference/usenixsecurity24/presentation/sridhara)