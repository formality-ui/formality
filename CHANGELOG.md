## [0.2.4](https://github.com/formality-ui/formality/compare/v0.2.3...v0.2.4) (2026-07-12)


### Bug Fixes

* **core,react:** implement function-based conditions and state injection ([ec68ad2](https://github.com/formality-ui/formality/commit/ec68ad2bbcb1fafa2945a9c9e528ec60811c8fe1))

## [0.2.3](https://github.com/formality-ui/formality/compare/v0.2.2...v0.2.3) (2026-07-12)


### Bug Fixes

* honor disabled from props-merge layers ([f0c7bb3](https://github.com/formality-ui/formality/commit/f0c7bb3821e429c3123f742fde26a562f7f8afc7))
* **react:** flush per-field debounce saves in submitImmediate; fix pending() ([0dca79a](https://github.com/formality-ui/formality/commit/0dca79a98b8008ecb445293d35d42fe2b6f90a48))

## [0.2.2](https://github.com/formality-ui/formality/compare/v0.2.1...v0.2.2) (2026-07-10)


### Bug Fixes

* honor per-field numeric debounce and remove whole-form error guard ([bbff475](https://github.com/formality-ui/formality/commit/bbff4754e6ba48b13e0cb91434d4c5e365863add))
* wire debouncedSubmit during render, not in effect ([b69f3fa](https://github.com/formality-ui/formality/commit/b69f3fa4aab34c5710d04c15777adf36df5327bf))

## [0.2.1](https://github.com/formality-ui/formality/compare/v0.2.0...v0.2.1) (2026-07-07)


### Bug Fixes

* stabilize inferred-subscription memo to prevent re-render loop ([6555291](https://github.com/formality-ui/formality/commit/6555291152a9fdc0b239869d9ec404afedd4e478))

# [0.2.0](https://github.com/formality-ui/formality/compare/v0.1.0...v0.2.0) (2026-07-06)


### Bug Fixes

* translate forwardRef to ref for host-element fallback ([09a6464](https://github.com/formality-ui/formality/commit/09a64642f846b507e128a49fd9ac28dac2c23002))


### Features

* deliver RHF ref as top-level forwardRef prop in Field ([512023c](https://github.com/formality-ui/formality/commit/512023c058c81601e2ad68633a803d468aa6c48c))

# [0.1.0](https://github.com/formality-ui/formality/compare/v0.0.1...v0.1.0) (2026-07-05)


### Bug Fixes

* Add comprehensive bug fixes and documentation with circular dependency detection ([4648cb2](https://github.com/formality-ui/formality/commit/4648cb27eabd4c79f10d260be114bcfab78df933))
* Add formDefaultFieldProps evaluation to usePropsEvaluation hook ([6fa28d4](https://github.com/formality-ui/formality/commit/6fa28d47de3b9dfa835fa548051d38ab36affb1e))
* Auto-save validation now targets only changed fields, not all fields ([f11b450](https://github.com/formality-ui/formality/commit/f11b450d347dd12a4e75ac734218ec3b529cb339))
* Auto-save validation now targets only changed fields, not all fields ([5d09c0f](https://github.com/formality-ui/formality/commit/5d09c0f98caaed74f69d4a3a6f03d8f7ed6e413b))
* Migrate example annotations to React overlay types ([a1c46f4](https://github.com/formality-ui/formality/commit/a1c46f402520f695d77e52731845da583d993476))
* **react:** Correct useWatch array value unwrapping in conditions ([bd28c58](https://github.com/formality-ui/formality/commit/bd28c58ac08c1c663a58f9478f489f368d32b82a))
* Restore 90% coverage gate in CI verify job ([52b83d5](https://github.com/formality-ui/formality/commit/52b83d5e00b41d598b5fe1a1d1a8ad78353c0725))
* Run validation on manual submit path ([d521fae](https://github.com/formality-ui/formality/commit/d521fae5390faf6fb1dd620068b925be729d0517))
* Strict-type-check all examples and gate in CI ([e1d29bd](https://github.com/formality-ui/formality/commit/e1d29bd3a7361606c40e3067a6507250a399c66e))
* Update autosave-validation.test.tsx with forwardRef support ([825f1c2](https://github.com/formality-ui/formality/commit/825f1c2f4ffc9ec4ba4cdcde12a86c93fb530245))
* Update FieldGroup test components with forwardRef support ([133c66d](https://github.com/formality-ui/formality/commit/133c66d0f824f1699065ad70d747c8c66944fc47))
* Update Form test components with forwardRef support ([f30b6c9](https://github.com/formality-ui/formality/commit/f30b6c92f104fbfe1f442f10f3137a4b2897f264))
* Update UnusedFields.test.tsx with forwardRef support ([4a8ace4](https://github.com/formality-ui/formality/commit/4a8ace473eb62ba8984b81082cb986c73626e977))


### Features

* Add changesets configuration for versioning ([51a36fc](https://github.com/formality-ui/formality/commit/51a36fcaebcf83df11be61afd09c6e2477991128))
* Add code example to README demonstrating form configuration ([9a6991f](https://github.com/formality-ui/formality/commit/9a6991f6a362aaef26f6c4aedd96190338cbcb0f))
* Add comprehensive 8-layer priority order testing documentation and research ([62a22a7](https://github.com/formality-ui/formality/commit/62a22a7fbe75e2d190dc36a709f83beff6748895))
* Add comprehensive 8-layer priority order tests with dynamic evaluation ([bb3c3d4](https://github.com/formality-ui/formality/commit/bb3c3d49c5c3072a7b39123b5598ad1be3f178e9))
* Add comprehensive condition disabled priority tests with multi-field and circular dependency scenarios ([32be1ec](https://github.com/formality-ui/formality/commit/32be1ec4e2f19b0f44a5cdc46dafac3dd0022b41))
* Add comprehensive examples directory with complete documentation ([169a428](https://github.com/formality-ui/formality/commit/169a4283e5aac669f53a1bea51e4e98c9ffcb628))
* Add comprehensive mixed debounce settings integration tests ([ce297b5](https://github.com/formality-ui/formality/commit/ce297b5b338e30a4950b31bca8a5045328bf38f3))
* Add comprehensive mixed matcher support for isDisabled ([a43bdae](https://github.com/formality-ui/formality/commit/a43bdae7a9d6da6fe3095d8fdc95bb403a2e047f))
* Add comprehensive mixed matcher tests for multi-field isDisabled ([9f0258f](https://github.com/formality-ui/formality/commit/9f0258fd436a3878d227796a86d7052c584da7bf))
* Add comprehensive rapid changes tests for useSubscriptions hook memory leak prevention ([fcbfb77](https://github.com/formality-ui/formality/commit/fcbfb775527266606438a1b6671cb38e57f6d2e1))
* Add comprehensive README files and integration tests for Formality framework ([84d2260](https://github.com/formality-ui/formality/commit/84d22603993d0a2c7d7b894c5a71af01926e75a4))
* Add comprehensive regression tests for normal debounce preservation ([b4e705c](https://github.com/formality-ui/formality/commit/b4e705c5e4e8a5c15d2956f58f643e525e853552))
* Add comprehensive test coverage for FieldGroup, Field, and UnusedFields components with auto-save support ([7fa150f](https://github.com/formality-ui/formality/commit/7fa150f427c8ad0272a65b5e21bd45d44b97c978))
* Add comprehensive tests for multi-field isDisabled conditions with field state matchers ([ca12974](https://github.com/formality-ui/formality/commit/ca12974de6cd83d95d478dbeaae5d939cb44f2ae))
* Add comprehensive unmount cleanup tests for useSubscriptions hook ([669dc47](https://github.com/formality-ui/formality/commit/669dc4737e0b0c515a77a8dfaeef9397b590307e))
* Add config disabled priority tests with JSX prop overrides ([e18934b](https://github.com/formality-ui/formality/commit/e18934b6de6cdc5b6fb7e572733cdcfaaf9d330c))
* Add core form utilities package with expression engine and validation ([f2be723](https://github.com/formality-ui/formality/commit/f2be723d40be747b653165ea66aeba58d5ffecc7))
* Add debounce false type support to Form component interface ([87cfba5](https://github.com/formality-ui/formality/commit/87cfba50a0edaa230d91c6d68f9c532d984f321f))
* Add development logging and double-cleanup detection for subscriptions ([0af0bdc](https://github.com/formality-ui/formality/commit/0af0bdc7fcf3a7bbe07135a9743e45283e9666b8))
* Add disabled property to FieldState interface for type consistency ([49f1265](https://github.com/formality-ui/formality/commit/49f12650249cfcf0c3a84cbdb6f62b0ff429b011))
* Add explicit null/undefined handling for arithmetic operations ([5d284ed](https://github.com/formality-ui/formality/commit/5d284ed38710e00da43b17ccc69113d1579ec954))
* Add field state matcher support and fix auto-save validation ([88d9cdd](https://github.com/formality-ui/formality/commit/88d9cdd79a0759568761bc26d19899d942debfc5))
* Add field state matcher support for isValid and isDisabled ([c047e97](https://github.com/formality-ui/formality/commit/c047e97b71ef9acd4b7c51aca6425179ff4e38c4))
* Add form and provider default field props to Field component ([4b67eab](https://github.com/formality-ui/formality/commit/4b67eab989bf83fd4d54aeab20baae632a9752c9))
* Add immediate submission tests for debounce false ([071beda](https://github.com/formality-ui/formality/commit/071beda90cf369ab08e1da18d7cedfa5c3c9fdcf))
* Add initial project structure with monorepo setup ([a82c07e](https://github.com/formality-ui/formality/commit/a82c07ef81a222008f6bde64a702e2a28882a976))
* Add inputConfig parameter to changeField callback ([e2b2268](https://github.com/formality-ui/formality/commit/e2b22688ad8a7cfba76dcae932bd5a175308b992))
* Add JSX disabled prop priority tests with all sources active ([463172a](https://github.com/formality-ui/formality/commit/463172a3ecae555d09a7ba6f60fafecc5ad4aece))
* Add object when isDisabled matcher for multi-field disabled checks ([674b8d3](https://github.com/formality-ui/formality/commit/674b8d394ae63ea09b7640bd2e9e9231656e7f1b))
* Add object when with mixed matchers support for isDisabled ([6f491dc](https://github.com/formality-ui/formality/commit/6f491dc5d5f47d7b36664ba99992d0efb9e400a8))
* Add opt-in defineInputs helper for input type key narrowing ([e314f47](https://github.com/formality-ui/formality/commit/e314f4762a3b50a697b8303f424ec1806475cbf2))
* Add per-effect subscription tracking to prevent memory leaks and cleanup overruns ([1463ec6](https://github.com/formality-ui/formality/commit/1463ec6a67ae7564c51ac1bc07e35d3fefad16ac))
* Add provider-level evaluation to usePropsEvaluation hook ([6bf0b93](https://github.com/formality-ui/formality/commit/6bf0b93e96481d84024a2065a5b44c8e2b6357d9))
* Add React context and proxy state utilities to @formality/react ([9a77309](https://github.com/formality-ui/formality/commit/9a773096df0c3bc8bcc8a27e2629b05121d06def))
* Add React form components and testing utilities to @formality/react ([d2205c5](https://github.com/formality-ui/formality/commit/d2205c50a11846c054312823dea4cde4145d8b97))
* Add React type overlays for precise component/rules typing ([e2bf5a7](https://github.com/formality-ui/formality/commit/e2bf5a778951132a5f511c756aaf6fb1ccbd056d))
* Add type guards and null/undefined handling for arithmetic operations ([1f875ca](https://github.com/formality-ui/formality/commit/1f875ca6e40a624e5c7b14ace9ba4880ae3bdb88))
* Add typeof operator support and complex expression tests ([2a0736f](https://github.com/formality-ui/formality/commit/2a0736f741b0516d4c56ea2a00b524cc6b2d4eba))
* Add TypeScript type exports for usePropsEvaluation hook ([53d18dd](https://github.com/formality-ui/formality/commit/53d18ddb102c8a44aafeb4aa89f8b282c542e504))
* Add useFieldDisabledState hook and comprehensive test coverage ([027e5cf](https://github.com/formality-ui/formality/commit/027e5cfca6e4c0f82b609f8ed558daaabd9834b2))
* Complete 8-layer prop integration in usePropsEvaluation and Field components ([55f11bd](https://github.com/formality-ui/formality/commit/55f11bd3bb90f66968e1fd703f0ed959f4a28ce5))
* Complete form-level evaluation tests with comprehensive coverage ([56fd2a4](https://github.com/formality-ui/formality/commit/56fd2a479821e8ccbdc024f10886500dd7f86a07))
* Complete provider-level evaluation tests with comprehensive test coverage ([9d2e016](https://github.com/formality-ui/formality/commit/9d2e0167570f25fbc9cd685abbefb3a76dc280e0))
* **core:** Add field state proxy for expression metadata access ([0b31ff4](https://github.com/formality-ui/formality/commit/0b31ff46c0ef21217e60899fb04c30b0537ab05d))
* Export FormalityFieldComponentProps type for injected field props ([a313463](https://github.com/formality-ui/formality/commit/a31346316fbea6b4fd128156fcef31ae82891b79))
* Export ValidatorEntry union and simplify ValidatorFactory to variadic signature ([79e650c](https://github.com/formality-ui/formality/commit/79e650c41264f3c5e38f04e0bcd66860aba75686))
* Implement conditional execution for inputConfig debounce: false ([c56ff92](https://github.com/formality-ui/formality/commit/c56ff92e608cfcb1a9f0d7a33cbb59bb7d511157))
* Implement two-pass evaluation in useConditions for disabled state ([a3f7bb5](https://github.com/formality-ui/formality/commit/a3f7bb5458a92915399dac34a6ed74ec48f7aa96))
* Make FieldProps generic over field name to catch typos ([dacbb0b](https://github.com/formality-ui/formality/commit/dacbb0bd1caa8d4a3eb8ad3091ef02f12193dd42))
* Narrow Form config keys to catch typos at compile time ([cc01f42](https://github.com/formality-ui/formality/commit/cc01f422c172c3c912be4d7802bd9941911bff5c))
* Pass inputConfig to changeField for per-field debounce control ([e272448](https://github.com/formality-ui/formality/commit/e2724484d162b1f433cea5d70b3a0dcf36eedb25))
* **react:** Implement set/selectSet condition value application ([2d927e9](https://github.com/formality-ui/formality/commit/2d927e9477dcbbbb0a6119bc29ee330787a54913))
* **react:** Refactor hooks for isolated field subscriptions ([5fedb72](https://github.com/formality-ui/formality/commit/5fedb726b9c225195ae2471bfd134967f94374e6))
* Replace yalc commands with changeset configuration in package.json ([8abdede](https://github.com/formality-ui/formality/commit/8abdede82d98ceedffaa2bd3c53f8fb2cdc99594))
* Resolve circular dependency with two-pass evaluation in useConditions ([6649432](https://github.com/formality-ui/formality/commit/66494328f8f6da6ccea638a5d9ab114d1ea6e3c6))
