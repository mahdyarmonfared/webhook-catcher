/**
 * CLI runner for WebhookCatcher.
 */

const { chalk } = require('./ansi');

function parseArgs(args) {
  const parsed = {
    port: 3016,
    help: false,
    version: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    } else if ((arg === '-p' || arg === '--port') && args[i + 1]) {
      parsed.port = parseInt(args[++i], 10);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
${chalk.bold(chalk.cyan('🎣 WebhookCatcher Studio & Server'))} ${chalk.dim('v1.0.0')}
${chalk.dim('Zero-dependency local HTTP webhook inspector, debugger & SSE live stream.')}

${chalk.bold('USAGE:')}
  ${chalk.green('webhook-catcher')} ${chalk.cyan('[options]')}

${chalk.bold('OPTIONS:')}
  ${chalk.cyan('-p, --port <number>')}     Port for Webhook Catcher server (default: 3016)
  ${chalk.cyan('-h, --help')}              Display help guide
  ${chalk.cyan('-v, --version')}           Display version

${chalk.bold('WEBHOOK INGESTION:')}
  Send any HTTP request (POST/GET/PUT/DELETE) to:
  ${chalk.yellow('http://localhost:3016/hook/<any-endpoint>')}

${chalk.bold('EXAMPLES:')}
  $ webhook-catcher --port 3016
  $ curl -X POST http://localhost:3016/hook/stripe -d '{"event": "payment_intent.succeeded"}'
`);
}

async function execute(args = process.argv.slice(2)) {
  const options = parseArgs(args);

  if (options.version) {
    const pkg = require('../../package.json');
    console.log(`webhook-catcher v${pkg.version}`);
    return 0;
  }

  if (options.help) {
    printHelp();
    return 0;
  }

  const { startServer } = require('../server/server');
  startServer(options.port);
}

module.exports = {
  execute,
  parseArgs
};
