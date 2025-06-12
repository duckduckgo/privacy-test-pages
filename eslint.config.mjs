import globals from 'globals';
import ddgConfig from '@duckduckgo/eslint-config';
import html from "@html-eslint/eslint-plugin";

const htmlRulesToDisable = Object.fromEntries(
    ddgConfig.flatMap(config => Object.keys(config.rules).map(rule => [rule, "off"]))
);

export default [
    {
        ignores: [
            "privacy-protections/fingerprinting/helpers/diff.js",
            "node_modules/",
        ]
    },
    ...ddgConfig,
    {
        files: ["**/*.html"],
        plugins: {
            html,
        },
        language: "html/html",
        rules: {
            ...htmlRulesToDisable
        }
    },
    {
        files: [
            "helpers/idb-wrapper.js",
            "privacy-protections/storage-partitioning/helpers/common.js",
            "privacy-protections/storage-partitioning/helpers/tests.js",
            "privacy-protections/fingerprinting/helpers/constants.js",
            "privacy-protections/storage-blocking/helpers/commonTests.js",
            "privacy-protections/storage-blocking/helpers/globals.js",
            "privacy-protections/fingerprinting/main.js",
            "privacy-protections/fingerprinting/helpers/canvas.js"
        ],
        languageOptions: {
            sourceType: "script",
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.commonjs,
                ...globals.browser,
                ...globals.jasmine,
                ...globals.node,
            },
        },
    }
];