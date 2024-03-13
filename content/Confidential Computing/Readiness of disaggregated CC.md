---
title: Readiness of disaggregated CC
date: 2024-02-14T18:08
lastmod: 2024-03-13T11:57
cssclasses: []
---
# Resource disaggregation
- Co-locate same components such as CPUs, DRAMs as a group and interconnect them over high-speed network fabric.

- Resource disaggregation first started with the *computing* units such as CPU, GPU, and FPGA.
	- It allows flexible and efficient resource allocation for computing workloads that change its demand over time.
	- e.g., CPU, GPU, AI processor, SmartNIC, IPU
- More recently, the idea has expanded to memory components such as SSD, DRAM and PRAM.
	- allows an efficient sharing of persistent data among the tenants as well as across VM migration.



# Challenges
- Current usage of TEEs is confined in *monolithic* server model.
	- All required resources such as storage and memory are present in the same physical machine, without considering the *disaggregated* resources presented in data centers.
- CC doesn't trust any components outside of its TCB, and current TEE ecosystem does not provide a way to build trust among different TEE components or other non-secure computing units.
- Data inside TEEs, by design, cannot be shared with hardware accelerators such as FPGAs.
	- Recent works solve this problem: [[Sec'24] ACAI](https://www.usenix.org/conference/usenixsecurity24/presentation/sridhara) and [[NDSS'24] CAGE](https://www.ndss-symposium.org/wp-content/uploads/2024-763-paper.pdf)


# HW components

>[!todo] Survey on the readiness of commodity HW

>[!question] How to expand trust from in-host TEE to other components, especially to other physical machine? 
>- One solution is to make all nodes TEE-enabled.
>- Protecting non-TEE nodes can be done via bus-level isolation if they are directly physically connected to a TEE host.
>	- [[Arxiv'21] Composite Enclaves: Towards Disaggregated Trusted Execution](https://arxiv.org/pdf/2010.10416.pdf)
>	- [[Micro'22] CRONUS: Fault-isolated, Secure and High-performance Heterogeneous Computing for Trusted Execution Environment](https://ieeexplore.ieee.org/document/9923810)


### DSA (Data Streaming Accelerator)
[DSA](https://www.youtube.com/watch?v=21j7LGPIHB8) is an accelerator that enables high performance data mover capabilities (e.g., copy to/from volatile memory, persistent memory, memory-mapped I/O) and transformation operations (e.g., memory comparison and delta generation, VM fast checkpointing). It will also be integrated into the upcoming Intel Xeon processor (Sapphire Rapids).

### CXL (Computer Express Link)
CXL is an open standard for **high-speed low-latency interconnect between CPUs and other hardware devices** such as accelerators. CXL was first proposed by Intel to solve the communication problems of hardware disaggregation in data centers. CXL will be a feature in the new Intel Xeon processor (Sapphire Rapids), which is to be released at the end of 2022.

### PCIe
[[PCIe]] (Peripheral Component Interconnect Express) is a high-speed serial computer expansion bus standard used for connecting hardware components to the motherboard.

### TDISP
[[TDISP]] stands for TEE Device Interface Security Protocol. It is a new framework and architecture to secure I/O virtualization (for both CXL and PCIe) and manage secure environments.

### GPU / Accelerators
#### Accelerators supporting CC
- [[OSDI'18]Graviton: Trusted execution environments on gpus](https://www.usenix.org/conference/osdi18/presentation/volos)
- [[Arxiv'21] IceClave: A Trusted Execution Environment for In-Storage Computing](https://arxiv.org/abs/2109.03373)
- [[Arxiv'22] ShEF: Shielded Enclaves for Cloud FPGAs](https://arxiv.org/pdf/2103.03500.pdf)
- [[FCCM'21]Trusted Configuration in Cloud FPGAs](https://ieeexplore.ieee.org/document/9443664)
- [[Web] NVIDIA Hopper Architecture In-Depth](https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/)
	- **New Confidential Computing support** protects user data, defends against hardware and software attacks, and better isolates and protects virtual machines (VMs) from each other in virtualized and MIG environments. H100 implements the world’s first native Confidential Computing GPU and extends the trusted execution environment (TEE) with CPUs at full PCIe line rate.


#### Building trust from cpu to accelerator
- [[Sec'24] ACAI: Protecting Accelerator Execution with Arm Confidential Computing Architecture | USENIX](https://www.usenix.org/conference/usenixsecurity24/presentation/sridhara)
- [[NDSS'24] CAGE: Complementing Arm CCA with GPU Extensions](https://fengweiz.github.io/paper/cage-ndss24.pdf)
- [[USENIX Sec'23] SHELTER: Extending Arm CCA with Isolation in User Space](https://www.usenix.org/conference/usenixsecurity23/presentation/zhang-yiming)


### IPU
TODO


# Software challenges
>[!question] What can be additional overhead for applying confidential computing?

>[!question] Is there any software techniques or optimizations cannot be applied in the context of CC?

>[!question] Is there any missing part in software layer to apply CC?

>[!seealso] Opposite stance
>Based on some observation that VMs used in public clouds don't utilize hypervisor features and resources are mostly assigned statically, [[OSDI'23] Paper: Core Slicing](https://www.usenix.org/conference/osdi23/presentation/zhou-ziqiao) suggests to use bare-metal hardware without virtualization by just statically slice hardware to guests. 
>We both observed that current CC can't fully leverage hypervisor features, and this paper takes their steps to remove hypervisor. On the other hand, we want to utilize those missing features properly.

### Memory deduplication
This is straightforward. 

### Large page table
TODO

### IOMMU
TODO



# Similar works
- [[Arxiv'22] Empowering Data Centers for Next Generation Trusted Computing](https://arxiv.org/abs/2211.00306)
	- The paper design a distributed TEE solution that allows a tenant to securely use TEE nodes (including CPUs and accelerators) and non-TEE legacy nodes.
		1. Use TEEs on CPUs and DSAs when available. Use such TEEs to protect all the data leaving the corresponding nodes. 
		2. Employ a centralized security controller that shields all the non-TEE nodes. All non-TEE nodes are placed behind the trusted controller who imparts TEE properties such as attestation, isolation, and secure channel.
		3. The initial state of the nodes is attested and cannot be changed thereafter. The controller checks that the CSP's resource management decisions do not violate resource isolation and secure path guarantees.
- [[Arxiv'21] Composite Enclaves: Towards Disaggregated Trusted Execution](https://arxiv.org/pdf/2010.10416.pdf)
- [[Micro'22] CRONUS: Fault-isolated, Secure and High-performance Heterogeneous Computing for Trusted Execution Environment](https://ieeexplore.ieee.org/document/9923810)
- [[S&P'20] Enabling rack-scale conﬁdential computing using heterogeneous trusted execution environment](https://ieeexplore.ieee.org/document/9152787)
	- Enable TEE abstractions for a single rack containing non-TEE nodes
	- Do not scale to multiple racks and are not designed to leverage nodes that have TEE support.
- [[APSys'23] Trusted Heterogeneous Disaggregated Architectures](https://dl.acm.org/doi/10.1145/3609510.3609812)
