---
date: 2024-08-16T13:29
lastmod: 2024-08-19T23:01
---

## Summary
WorldGuard makes it easy for developers to enable a Trusted Execution Environment (TEE) on [RISC-V](https://www.synopsys.com/glossary/what-is-risc-v.html) platforms. As a hardware-enhanced software isolation solution, WorldGuard provides protection against improper access to memory or devices by software applications and other bus initiators (such as DMAs). Designers can quickly create *domains*, also known as “worlds,” for isolated code execution and data protection. WorldGuard doesn't break the RISC-V ISA and doesn't require new instructions to be used. It simply adds secure metadata to the transactions issued by the various bus initiators and checks permissions against an Access Control List (ACL) at the destination, whether it's memory or a peripheral. The isolation is based on multiple levels of privilege for each world, offering robust SoC-level information control.

WorldGuard provides an open, system-level approach to securing access to system resources (memory and peripherals) by software applications. This approach is ideal for creating multiple trusted environments, enabling a Trusted Computing Base (TCB) where the highest level of trust is limited to the secure ROM boot, the Machine-mode firmware, the secure applications, and the Operating Systems (OSs) that implement them. This base of trust is also referred to as the “Trusted Agent.”

WorldGuard offers SoC-level information control with advanced isolation control, based on multiple levels of privilege per world, and an unlimited amount of worlds. In addition to the RISC-V Physical Memory Protection (PMP) that provides memory isolation for code and data manipulated by the CPU, WorldGuard expands hardware isolation to the whole SoC in order to protect caches, interconnects, arbitrary bus masters, memories and peripherals. A **wgMarker**, adds a World ID to all transactions that are issued by that particular CPU core. This additional bit of metadata is then propagated through the interconnect down to peripherals and memories where access controls are enforced. Feature-rich OS, applications, and Trusted Execution Environments (TEE) can be isolated and protected inside a high-performance multi-core system.

## Worlds
- *Worlds* are execution contexts that include *agents* such as cores and devices that can initiate a transaction on a physical address, and *resources* such as memories and peripheral devices that respond to transactions at a physical address.
- Worlds are uniquely identified by a hardware *Word Identifier (World ID or WID)*
- Worlds are created and configured by a TEE such as the Secure Monitor, usually at system boot time. The WID of the running world is set by the Secure Monitor.
- Enforcement of world boundaries is done by hardware using a combination of the WID and physical address. This ensures that a world cannot access resources outside its defined boundaries.

### Available scenarios between cores and worlds
- One core dedicated to a single world. All transactions from that core, regardless of privilege mode, are tagged with the WID of that world. Different cores can be used to run different worlds.
- One core support multiple worlds by switching world contexts under control of the M-mode Secure Monitor. 

In both scenarios, a world can run on more than one core at a time.

## Isolation of WorldGuard
### Vertical isolation
- Within a world, **privilege modes** isolate user software from supervisory (operating system) software; user (U), supervisor/hypervisor (S), and machine (M) modes
- Further vertical isolation can be achieved by using the RISC-V Physical Memory Protection (PMP) facility to prevent user and supervisor software from accessing machine-mode memory

### Horizontal isolation
- Within a world, the operating system kernel uses the page tables and MMU to isolate the resources of one application from another
- **Horizontal isolation between worlds is provided by hardware using the WID** field under supervision of the Secure Monitor, which runs in M-mode.

## vs Arm TrustZone

The biggest different is that TrustZone has only two worlds, one secure world and one non-secure world. Typically, the secure world is a slave, intended for support of the non-secure world and only responding to their requests. In contrast, WorldGuard can create unlimited number of worlds, even for each user application, to support isolation enforced by hardware.

In TrustZone, the NS bit isolates secure world resources from the non-secure world. The WorldGuard's WID is equivalent to the NS bit in that it identifies the running world. But it is more scalable because it can represent more than two worlds. If the system is built for only two worlds, the WID need only be one bit wide. Therefore, WorldGuard can emulate TrustZone TEE architecture by creating two worlds (secure and non-secure) or three worlds (secure, non-secure and monitor). 

## More details

### Hardware-enforced isolation
- Loads/Stores at each privilege mode are tagged with a *WID* by an additional CSR
- Transactions from all initiators are tagged with a WID by a configurable *marker*.

### WorldGuard *checkers* protect each resource
- Checkers compare every access that reaches them against a set of *rules*.
- *Rule* registers define permissions for each WID across a subset of the physical address range that the checker protects
- If any rule allows access, access is granted.

### Trusted WID
Trusted WID is the only WID with configuration access to the WorldGuard checkers. The Trusted WID is defined as a WID with a value of all ones. e.g., WID 3 in 4-world scenario.


![[Pasted image 20240819171212.png]]

![[Pasted image 20240819171635.png]]
- WID LIST contains WID allowed for a given core. In this case, this core can runs WID 1, 2, 3, 4, 5. The core can't pretend to work as WID 6. 
- Modes
	- Machine mode: When this core is work as machine mode, it will tagged as WID 1 (in this example), which is set during per core configuration. Machine mode can change the WID for supervisor mode and user mode using one of the available WID in the WIDLIST.
	- Supervisor mode: Machine mode can delegate a subset of WIDLIST to supervisor mode (MWIDDELEG). Then, supervisor mode can set WID for user mode using one for the available WID in the MWIDDELEG (4 and 5 in this example). i.e, RTOS
	- User mode: Both machine mode and supervisor mode can change the WID of the user mode. i.e, task
- World ID (WID) is tagged for each cache line that will be propagated to the interconnect and checked at the destination

![[Pasted image 20240819173810.png]]

SiFive provides pre-configured WorldGuard-enabled core complex. This core complex includes all the WorldGuard gadgets inside, including the cahces, proper CSRs, debug, traces, wgMarkers and wgCheckers.

![[Pasted image 20240819174532.png]]

SiFive also provides propper WorldGuard Marker for outside (i.e., AXI front port).  It converts between TL WID and AXI user bit WID on all inbound/outbound ports. 

![[Pasted image 20240819175621.png]]




# References
- https://www.sifive.com/press/sifive-gives-worldguard-to-risc-v-international-to
- https://www.sifive.com/technology/shield-soc-security
- https://www.youtube.com/watch?v=jtJ7eyQK0oM
- https://riscv.org/blog/2023/07/sifives-worldguard-security-platform-now-available-to-the-entire-risc-v-ecosystem/
- [[SEC'21] CURE: A Security Architecture with CUstomizable and Resilient Enclaves](https://www.usenix.org/conference/usenixsecurity21/presentation/bahmani)
- [[pdf] Using SiFive WorldGuard for Deploying a TEE/REE System](https://sifive.cdn.prismic.io/sifive/a2a13237-aa42-480a-85e8-249ebb38490a_WorldGuard_TEE_REE_App_Note_v1.4.pdf)
- [[pdf] SiFive WorldGuard Technical Paper](https://sifive.cdn.prismic.io/sifive/31b03c05-70fa-4dd8-bb06-127fdb4ba85a_WorldGuard-Technical-Paper_v2.4.pdf)