/* eslint-disable prefer-const */
import { CodeGenerator, Project, SchemaComposer } from "../lib";
import { fixParameters } from "../lib/helpers/parameters";
import { getIntl } from "../lib/internationalization";

import chalk from "chalk";
import axios from "axios";
import { GluegunToolbox } from "gluegun";
import { defineMessages } from "@formatjs/intl";

export const defaultGenerationFile = "web3api.gen.js";
export const defaultManifest = ["web3api.yaml", "web3api.yml"];

const intl = getIntl();

const helpMessages = defineMessages({
  h: {
    id: "commands_codegen_options_h",
    defaultMessage: "Show usage information",
    description: "",
  },
  m: {
    id: "commands_codegen_options_m",
    defaultMessage: "Path to the Web3API manifest file (default",
    description: "",
  },
  i: {
    id: "commands_codegen_options_i",
    defaultMessage:
      "IPFS node to load external schemas (default: dev-server's node)",
    description: "",
  },
  o: {
    id: "commands_codegen_options_o",
    defaultMessage: "Output directory for generated types (default: types/)",
    description: "",
  },
  e: {
    id: "commands_codegen_options_e",
    defaultMessage:
      "ENS address to lookup external schemas (default: 0x0000...2e1e)",
    description: "",
  },
  genFile: {
    id: "commands_codegen_options_genFile",
    defaultMessage: "Generation file",
    description: "",
  },
  genFilePath: {
    id: "commands_codegen_options_genFilePath",
    defaultMessage: "Path to the generation file (default",
    description: "",
  },
  options: {
    id: "commands_codegen_options_options",
    defaultMessage: "options",
  },
  node: {
    id: "commands_codegen_options_i_node",
    defaultMessage: "node",
    description: "IPFS node",
  },
  path: {
    id: "commands_codegen_options_o_path",
    defaultMessage: "path",
    description: "file path for output",
  },
  address: {
    id: "commands_codegen_options_e_address",
    defaultMessage: "address",
    description: "Ethereum address",
  },
});
const genFileOp = intl
  .formatMessage(helpMessages.genFile)
  .toLowerCase()
  .replace(" ", "-");
const optionsStr = intl.formatMessage(helpMessages.options);
const nodeStr = intl.formatMessage(helpMessages.node);
const pathStr = intl.formatMessage(helpMessages.path);
const addrStr = intl.formatMessage(helpMessages.address);
const hStr = intl.formatMessage(helpMessages.h);
const mStr = intl.formatMessage(helpMessages.m);
const iStr = intl.formatMessage(helpMessages.i);
const oStr = intl.formatMessage(helpMessages.o);
const eStr = intl.formatMessage(helpMessages.e);
const defaultManifestStr = defaultManifest.join(" | ");

const HELP = `
${chalk.bold("w3 codegen")} ${chalk.bold(`[<${genFileOp}>]`)} [${optionsStr}]

${intl.formatMessage(helpMessages.genFile)}:
  ${intl.formatMessage(helpMessages.genFilePath)}: ${defaultGenerationFile})

${optionsStr[0].toUpperCase() + optionsStr.slice(1)}:
  -h, --help                              ${hStr}
  -m, --manifest-path <${pathStr}>              ${mStr}: ${defaultManifestStr})
  -i, --ipfs [<${nodeStr}>]                     ${iStr}
  -o, --output-dir <${pathStr}>                 ${oStr}
  -e, --ens [<${addrStr}>]                   ${eStr}
`;

export default {
  alias: ["g"],
  description: intl.formatMessage({
    id: "commands_codegen_description",
    defaultMessage: "Auto-generate API Types",
    description: "description of command 'w3 codegen'",
  }),
  run: async (toolbox: GluegunToolbox): Promise<void> => {
    const { filesystem, parameters, print } = toolbox;

    const { h, m, i, o, e } = parameters.options;
    let { help, manifestPath, ipfs, outputDir, ens } = parameters.options;

    help = help || h;
    manifestPath = manifestPath || m;
    ipfs = ipfs || i;
    outputDir = outputDir || o;
    ens = ens || e;

    let generationFile;
    try {
      const params = toolbox.parameters;
      [generationFile] = fixParameters(
        {
          options: params.options,
          array: params.array,
        },
        {
          h,
          help,
        }
      );
    } catch (e) {
      print.error(e.message);
      process.exitCode = 1;
      return;
    }

    if (help) {
      print.info(HELP);
      return;
    }

    if (outputDir === true) {
      const outputDirMissingPathMessage = intl.formatMessage(
        {
          id: "commands_build_error_outputDirMissingPath",
          defaultMessage: "{option} option missing {argument} argument",
          description: "",
        },
        {
          option: "--output-dir",
          argument: `<${intl.formatMessage(helpMessages.path)}>`,
        }
      );
      print.error(outputDirMissingPathMessage);
      print.info(HELP);
      return;
    }

    if (ens === true) {
      const domStr = intl.formatMessage({
        id: "commands_codegen_error_domain",
        defaultMessage: "domain",
        description: "ENS domain (e.g. https://name.eth)",
      });
      const ensAddressMissingMessage = intl.formatMessage(
        {
          id: "commands_build_error_testEnsAddressMissing",
          defaultMessage: "{option} option missing {argument} argument",
          description: "",
        },
        {
          option: "--ens",
          argument: `<[${intl.formatMessage(helpMessages.address)},]${domStr}>`,
        }
      );
      print.error(ensAddressMissingMessage);
      print.info(HELP);
      return;
    }

    let ipfsProvider: string | undefined;
    let ethProvider: string | undefined;
    let ensAddress: string | undefined = ens;

    if (typeof ipfs === "string") {
      // Custom IPFS provider
      ipfsProvider = ipfs;
    } else if (ipfs) {
      // Dev-server IPFS provider
      try {
        const {
          data: { ipfs, ethereum },
        } = await axios.get("http://localhost:4040/providers");
        ipfsProvider = ipfs;
        ethProvider = ethereum;
      } catch (e) {
        // Dev server not found
      }
    }

    // Resolve generation file & output directories
    generationFile =
      (generationFile && filesystem.resolve(generationFile)) ||
      filesystem.resolve(defaultGenerationFile);
    manifestPath =
      (manifestPath && filesystem.resolve(manifestPath)) ||
      ((await filesystem.existsAsync(defaultManifest[0]))
        ? filesystem.resolve(defaultManifest[0])
        : filesystem.resolve(defaultManifest[1]));
    outputDir =
      (outputDir && filesystem.resolve(outputDir)) || filesystem.path("types");

    const project = new Project({
      manifestPath,
    });

    const schemaComposer = new SchemaComposer({
      project,
      ipfsProvider,
      ethProvider,
      ensAddress,
    });

    const codeGenerator = new CodeGenerator({
      project,
      schemaComposer,
      generationFile,
      outputDir,
    });

    if (await codeGenerator.generate()) {
      const successMessage = intl.formatMessage({
        id: "commands_codegen_success",
        defaultMessage: "Types were generated successfully",
        description: "successfully generated code for language types",
      });
      print.success(`🔥 ${successMessage} 🔥`);
      process.exitCode = 0;
    } else {
      process.exitCode = 1;
    }
  },
};
