# [3.1.0](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v3.0.1...v3.1.0) (2024-08-13)


### Features

* **datapoints-graph:** [MTM-52605] Configure alarms and events in Data points graph 2.0 and display on chart ([#29](https://github.com/SoftwareAG/cumulocity-community-plugins/issues/29)) ([04813d1](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/04813d134fff69a5ad21189baea06e4a38230843))

## [3.0.1](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v3.0.0...v3.0.1) (2024-06-26)


### Bug Fixes

* **core:** add missing license ([aba8174](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/aba81743475d841c78ca2daa7c52ace50f3057a1))

# [3.0.0](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.6...v3.0.0) (2024-06-26)


### Features

* **core:** [no-issue] upgrade to v1020 of Web SDK and migrate to ng cli ([#25](https://github.com/SoftwareAG/cumulocity-community-plugins/issues/25)) ([1117a54](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/1117a546ba3b5d02720460b3d22d7c839a56e96e))


### BREAKING CHANGES

* **core:** Compatibility with versions lower than 1018.0.0 is no longer ensured.

Signed-off-by: Tristan Bastian <tristan.bastian@softwareag.com>
Co-authored-by: Dawid Janusz <daj@softwareag.com>
Co-authored-by: jdre <jdre@softwareag.com>

## [2.1.6](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.5...v2.1.6) (2023-11-27)


### Bug Fixes

* **datapoints-graph:** c8y version bump to fix asset selelctor icon issues ([#23](https://github.com/SoftwareAG/cumulocity-community-plugins/issues/23)) ([22ed604](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/22ed60491a510d20605e40e5265438c91d5cd292))

## [2.1.5](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.4...v2.1.5) (2023-07-26)


### Bug Fixes

* **datapoints-graph:** adding margin to the datapoint graph config view ([eb09afb](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/eb09afb2d8879d31f946bc8764833bb523b2b3ed))

## [2.1.4](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.3...v2.1.4) (2023-07-10)


### Bug Fixes

* **datapoints-graph:**  provide context do datapoints selector ([86f73cd](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/86f73cdaf4f43e03c71085805e9b188093f8e999))
* **datapoints-graph:** context from activated route unit tests ([d83b871](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/d83b871b3c781bb6bcf9370fa15bceadd2dff862))
* **datapoints-graph:** get context from activated route ([b2fdfad](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/b2fdfad31b235747564b3daa27fa32e837421136))

## [2.1.3](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.2...v2.1.3) (2023-06-05)


### Bug Fixes

* **datapoints-graph:** adding datapoint unit to tooltip ([000f465](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/000f465ae7fc83fc86b53a27705a0cfed4825e1e))
* **datapoints-graph:** code review ([8c43e96](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/8c43e963e2773ea49965ab42d19617c415cc651c))
* **datapoints-graph:** reverting package-lock.json changes ([765e944](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/765e94453b8b534d0e80522a081f671cb7f75103))
* **datapoints-graph:** updating tests ([6ea25b6](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/6ea25b6d4733fa56109a4d6f719b06f781e60183))

## [2.1.2](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.1...v2.1.2) (2023-05-08)


### Bug Fixes

* **datapoints-graph:**  unit ests fix ([66e7e0e](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/66e7e0ecbf2b91013b0e4d915b58f5ea61605128))
* **datapoints-graph:** add legend to screenshot ([316bb28](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/316bb28970f7fe00b6e1071c829148f439e3d195))
* **license:** copy license into build and use correct one in pkg.json ([872dadb](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/872dadb23c5e50fadc45f70054b3d7287e3489b0))

## [2.1.1](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.1.0...v2.1.1) (2023-05-04)


### Bug Fixes

* **ci:** do not override release asset of previous release ([0be99e8](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/0be99e81d14a3949b6f421162a9aa650795b3746))

# [2.1.0](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v2.0.0...v2.1.0) (2023-05-04)


### Bug Fixes

* **cypress-datapoints-graph:** cypress tests for datapoints graph fix ([98fad02](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/98fad02c459b05f05edad73897ff1e91dc634828))
* **datapoints-graph:** realtime button styling fix ([8f53af3](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/8f53af3ed7742520590b14d49ec3faa01e4366b8))
* **pre-commit:** pre-commit linting and commit message checking fix ([99e4c09](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/99e4c0909419d9228f539029076b4ad744d07173))


### Features

* **datapoints-graph:** save as image name change ([e22653e](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/e22653e07c001356056b3d43f4f00570220b6b74))

# [2.0.0](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v1.0.4...v2.0.0) (2023-05-02)


### Code Refactoring

* **name:** rename widgets to plugins ([797a7d0](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/797a7d0bfe20ccef271faf1d70b6b99ffaae6749))


### BREAKING CHANGES

* **name:** project renamed

## [1.0.4](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v1.0.3...v1.0.4) (2023-05-02)


### Bug Fixes

* **ci:** adjust release process ([ede3383](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/ede3383404600367055832192f02bacfd4dc910d))

## [1.0.3](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v1.0.2...v1.0.3) (2023-05-02)


### Bug Fixes

* **ci:** also create release on github not just the tag ([4d0a267](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/4d0a2673e18c9de0f3315c8eebaad2750b12278a))

## [1.0.2](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v1.0.1...v1.0.2) (2023-05-02)


### Bug Fixes

* **ci:** adjust release process ([dc5c144](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/dc5c144a01a6747438695a519897ca05bde97dcc))

## [1.0.1](https://github.com/SoftwareAG/cumulocity-community-plugins/compare/v1.0.0...v1.0.1) (2023-02-06)


### Bug Fixes

* move files to src folder ([5a2cc04](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/5a2cc0445419b32e04694da5736861d7a66ff029))

# 1.0.0 (2023-02-06)


### Bug Fixes

* point to correct repo ([722162a](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/722162a05a32b550da3bf7c9345e4dadfdd655a4))


### Features

* initial repo setup with demo widget ([2c6691a](https://github.com/SoftwareAG/cumulocity-community-plugins/commit/2c6691ac4405f025296d78619ec2b5895f2e6501))
