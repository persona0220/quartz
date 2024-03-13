---
date: 2024-02-28T03:18
lastmod: 2024-03-12T18:21
---
> [!quote]- Ziqiao Zhou, Yizhou Shan, Weidong Cui, Xinyang Ge, Marcus Peinado, Andrew Baumann. Core slicing: Closing the gap between leaky confidential {VMs} and bare-metal cloud. In , 2023.
> - [Link to paper site](https://www.usenix.org/conference/osdi23/presentation/zhou-ziqiao)
> - [Link to pdf file](<file:///Users/sujin/Library/CloudStorage/OneDrive-GeorgiaInstituteofTechnology/Zotero/storage/HFHJKY83/Zhou et al. - 2023 - Core slicing closing the gap between leaky confid.pdf>)

# Observation
- Observed that typical cloud VMs run with a static allocation of memory and discrete cores, and increasingly rely on I/O offload.
- Cloud providers do not exploit the full complexity enabled by hypervisor-based virtual machines for IaaS workloads.
	- Core: VMs offered by major public cloud providers including Amazon and Azure are sized at core granularity and scheduled on distinct physical cores
	- Memory: the memory allocated to guest VMs is static; techniques such as memory ballooning or transparent page sharing are avoided
- cloud providers limit oversubscription to only their own (first-party) VMs or disable it entirely


# Goal
- Remove hypervisor from the trusted computing base. 
- Instead, run confidential VMs on bare metal hardware.
- Core slicing enables multiple untrusted guest OSes to run on shared bare-metal hardware.
- To ensure isolation without the complexity of virtualization, guests take ***static slice*** of a machine's cores, memory and virtual I/O devices.


- [p] Bare metal cloud servers can avoid hypervisor-level side channel attacks.
- [c] No virtualization. Cannot benefit from virtualization techniques.

