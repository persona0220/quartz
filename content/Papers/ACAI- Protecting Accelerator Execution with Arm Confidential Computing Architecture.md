---
date: 2024-03-05T03:57
lastmod: 2024-03-10T04:15
---
[Link to pdf file](<file:///Users/sujin/Library/CloudStorage/OneDrive-GeorgiaInstituteofTechnology/Zotero/storage/8M53F75S/sec24summer-prepub-56-sridhara.pdf>)
[Link to paper site](https://www.usenix.org/conference/usenixsecurity24/presentation/sridhara)

## Design

### Protected region
- ==Shared memory region between the realm VM and the corresponding device==
- Owner realm VM and the accelerator have the same guest PA to host PA mappings. **(INV_bind)**
	- realm VM and device always have the same view of memory
	- RMM and SMMU stage-2 translation tables are always synchronized
- 1:1 host and guest page mappings. **(INV_host)**
- No overlapping physical memory in the protected region. Only one accelerator has a valid mapping from guest PA to host PA. **(INV_dev)**
	- programs the SMMU page tables to ensure that 

### ACAI ensures...
- the device and the realm start in a clean state
- An accelerator attached to a realm VM has a [[PCIe#IDE (Integrity and Data Encryption)|unique unforgettable identity]] after attestation **(INV_id)** 
- An accelerator is only accessible to one owner realm VM who is allowed to configure the device and setup protection keys and communicate with it. **(INV_own)**
	- Only the device and the owner VM have the key to encrypt and decrypt the data in the protected region.
- ==SMMU data structures are only accessible in root mode== to prevent untrusted access from the hypervisor

>[! example] VM Creation 
> 1. Hypervisor sets up a new VM, prepares the accelerator, and then invokes the monitor
> 2. Monitor initiate a secure accelerator attachment to enforce INV_id and INV_own
> 3. Monitor check if the accelerator is not already mapped to any realm VM.
> 4. If not, the monitor sends a reset signal and requests an attestation report.
> 5. Use IDE to ensure that the accelerator has a unique ID that doesn't overlap with existing devices (INV_id)
> 6. ACAI requires the attestation report from the device contains information about its firmware, configuration, and other state after secure boot.
> 7. Monitor forwards the accelerator report to the RMM, who combines it with the realm VM's attestation  for the remote verifier checks.

#### Interfaces
![[Pasted image 20240310032047.png]]
- Monitor maintains a list of all realm device StreamID for INV_own


##### World level isolation
- Leverages PCIe-5 IDE to infer the world of every device transaction to and set the `world_ext`bits
- ACAI expects the devices to explicitly tag `T` bit for each transaction
	- transaction with T=0: cannot access realm world memory and will be rejected by GPC
	- transaction with T=1: has to be successfully decrypted in the PCIe root port.

##### Intra-realm isolation
- Leverage Stage-2 translations
- Tables and other configurations are stored in protected realm memory (hypervisor can't access!)
- Monitor checks all updates to the SMMU
- Monitor uses the list of realm devices that it maintains and only allows the hypervisor to change stage-2 translations of non-realm devices.

![[Pasted image 20240310035130.png]]

| acronym | meaning |
| -------- | ------- |
|R1|[[Arm CCA#MPE (Memory Protection Engine)\|MEC]] ID for Realm VM1|
|K_R1|Key for MEC|
|pt|plain text|
|ct|cipher text|
|RP|Root port|
|RID|PCIe ID for Realm VM 1|
|K_RID1|Key for PCIe encryption|

---
## Details
### Problem
Let [[Arm CCA|CCA]]-VM to use [[Arm Accelerators |accelerators]] directly.
1. (GPU -> CPU)The accelerators cannot reason about the security of the host device, such as the authenticity of a realm VM, it connects to.
2. (CPU -> GPU) On the CPU side, the TEEs have to account for secure device access

### Challenges
>[!note] Fine-grain memory isolation
> After device allocation, all its accesses (DMA) have to be isolated not only to the **realm memory** but specifically to the **realm VM that owns the device**.
>- Otherwise, malicious devices attached to other realm VMs can compromise computation.
>![[Pasted image 20240305163725.png]]
>- Shared memory between the **device** and **VM** should not be accessed from other VMs (both realm, normal world), devices, and hypervisor.
>- Synchronization between MMU and SMMU has to be extended to be at a VM granularity (currently it's world granularity)

>[!note] Compatibility with untrusted code
> Need to ensure that untrusted hypervisor cannot maliciously reconfigure devices, the MMU, and the SMMU.
> - However, current untrusted hypervisor on Arm can controls and programs the SMMU.
> - ![[Pasted image 20240305163805.png]]
> - Further, the hypervisor can emulate devices or allocate compromised devices to break the realm VM’s data confidentiality or execution integrity
> > [!success] Let SMMU accessible only from root world
> > - To protect SMMU GPC, SMMU MMIO registers are only accessible to the root world.
> > - provide basic configurations of SMMU GPC, such as GPT base, GPT controls, fault handling, and TLB invalidation.


>[!note] Secure I/O paths
> To prevent from physical attacks, bus- and PCIe-level encryption with key management is required. 
> - the key management accounts for abrupt disconnections while ensuring that malicious devices, VMs, and the hypervisor cannot abuse it
> - ![[Pasted image 20240305163753.png]]



### Goal
1. If external accelerators connected over PCIe can access realm memory, such accelerators can break CCA protection that requires GPC.
2. Accesses from different accelerators should be isolated to their designated share
3. All possible I/Os, memory access paths, DMA and memory-mapped IO should be isolated from software and physical adversaries.
	- [!] hypervisor can manipulate the hardware I/O subsystem
	- [!] physical adversary can snoop and tamper the PCIe communication to bypass CPU and device TEE protection.
4. Maintain compatibility (minimal changes to RMM, monitor, guest OS, hypervisor)


### Background
#### CCA's VM abstraction for cloud setting
- P3 or F1 instance is provisioned as a bundle of a VM with a dedicated GPU or an FPGA respectively
- The accelerators are connected as **PCIe** devices
	- mobile or desktops with integrated accelerators which are used intermittently by the applications (e.g., a browser renders a GUI with a GPU which is then used by a game app).
