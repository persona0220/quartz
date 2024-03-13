---
date: 2024-03-12T22:32
lastmod: 2024-03-13T06:07
---

# TEE Device Interface Security Protocol (TDISP)

[TEE Device Interface Security Protocol (TDISP)](https://pcisig.com/tee-device-interface-security-protocol-tdisp) is a new framework and architecture to secure I/O virtualization.

- [c] If you wanted to ensure encryption in the past, it had to be done in a proprietary manner. Case in point, connecting Nvidia GPUs to AMD SEV VMs required cooperation from Nvidia, AMD, and Azure.
- [p] The TDISP framework standardizes the process and manages the entire key exchange, eliminating the need to build unique interfaces for each different device.

## Functions

1. Establishing a trust relationship between a TVM and a device
2. Securing the interconnect between the host and device.
	1. Detect register manipulation outside of TDISP
	2. Identify connection as no longer secure
	3. Flag the software
	4. Re-secure the link before the breach occurs.
3. Attach and detach a TDI in a trusted manner.

## Key management
1. Enables secure key exchange
2. Turn on and off the encryption, performing like a control panel, so you can refresh keys for the next hour


# References
- https://www.synopsys.com/blogs/chip-design/what-is-tdisp-pcie-io-virtualization.html
- https://pcisig.com/tee-device-interface-security-protocol-tdisp
- https://www.youtube.com/watch?v=nWl4Gh1nTkI
- https://www.synopsys.com/designware-ip/technical-bulletin/tee-device-interface-secure-protocol.html