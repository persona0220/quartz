---
date: 2024-03-05T14:30
lastmod: 2024-03-10T04:20
---

- Most cloud deployments use PCIe to connect powerful CPU cores to dedicated accelerators
- Flexibility to plug in the best-suited devices after procurement
- Scalability to connect 16-64 devices per node.
- Bus-level access control mechanisms (Arm TrustZone, RISC-V PMP) do NOT extend to such devices

>[! fail] Bounce-buffer design for encrypted communication
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
>- [c] Two extra copies + SW encryption + Integrity protection on both processors and peripherals **-> Overhead**
>- [c] API changes in application, drivers, device-side logic **-> Break compatibility**

---

## IDE (Integrity and Data Encryption)
- PCIe-5 specification introduces IDE which provides **confidentiality** and **integrity** guarantees for PCIe packets.
- ==Hardware encryption== can be leveraged to build a performant design without software-based encryption.
	- [p] With device-accessible realm memory with HW encryption on both CPU and accelerators, it removes the need for multiple data copies and software-based encryption-decryption.
	- [!] Not designed for untrusted hypervisor
- each PCIe link per device has a unique key which is used for data protection.