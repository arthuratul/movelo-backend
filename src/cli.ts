import { NestFactory } from '@nestjs/core';
import { CliModule } from './cli/cli.module';
import { CreateOAuthClientCommand } from './cli/commands/create-oauth-client.command';
import { GenerateKeysCommand } from './cli/commands/generate-keys.command';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: false,
  });

  const args = parseArgs(process.argv.slice(2));
  const command = process.argv[2];

  switch (command) {
    case 'oauth:create-client': {
      const name = args['name'];
      const clientId = args['client-id'];

      if (!name || !clientId) {
        console.error('Usage: npm run cli -- oauth:create-client --name <name> --client-id <id>');
        process.exit(1);
      }

      await app.get(CreateOAuthClientCommand).run(name, clientId);
      break;
    }

    case 'keys:generate': {
      app.get(GenerateKeysCommand).run();
      break;
    }

    default:
      console.error(`Unknown command: "${command}"`);
      console.error('Available commands:');
      console.error('  oauth:create-client  --name <name> --client-id <id>');
      console.error('  keys:generate');
      process.exit(1);
  }

  await app.close();
}

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      result[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return result;
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});