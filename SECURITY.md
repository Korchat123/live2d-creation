# Security policy

This project is pre-release and has no supported production versions.

Please report suspected vulnerabilities privately through GitHub's security
advisory feature. Do not include credentials, private recordings, camera or
microphone data, or exploitable bundle samples in a public issue.

Avatar bundles and control commands are untrusted input. Contributors must
preserve the validation-before-allocation boundary described in
`docs/security/threat-model.md`.
