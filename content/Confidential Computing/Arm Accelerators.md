---
date: 2024-03-05T02:38
lastmod: 2024-03-13T02:12
---
#Arm 

## Arm GPU
- Arm GPU share a unified memory with the CPU and other peripherals.
- Since the GPU and other peripherals share the main memory with the CPU, Arm introduces ==System Memory Management Unit (SMMU)== to manage DMA-capable peripherals. 
- Most Arm GPUs and other peripherals are physically connected to an SMMU.
- [[GPU TEE]]

### GPU software
#### Role
1. manages GPU computation environment
2. manages the interaction with the GPU hardware.

#### Type
- Kernel-layer driver: Midgard
- User-layer runtime: OpenCL libraries

#### GPU Software's workflow
1. To prepare the execution environment, allocate physical memory and creates CPU buffers based on the requirements of the GPU task
2. Load the critical components (GPU task code, data, and metadata) of the GPU task into the GPU memory
3. Create GPU page table and configure the corresponding GPU registers to allow the GPU to access the critical components via DMA.
4. Schedule the execution order and submits the GPU tasks via MMIO.
5. When GPU computation is terminated, fetch the execution results and restore the environment.

-----

## SMMU (System Memory Management Unit)
- Like CPU MMU, SMMU supports address translations (Stage-1 and Stage-2 translation) to control the access from the peripheral to the PAS.
- GPC is supported on SMMU (NW / Secure)
	- RME-DA further extends to distinguish Realm memory
- To protect the SMMU GPC, CCA introduces additional SMMU MMIO registers that are only accessible to the root world. These registers provide basic configurations of SMMU GPC, such as GPT base, GPC controls, fault handling, and TLB invalidation.
- [!] Untrusted hypervisor on Arm controls and programs the SMMU. The hypervisor can emulate devices or allocate compromised devices to break the realm VM’s data confidentiality or execution integrity. 
	- e.g., page table registers, translation config registers