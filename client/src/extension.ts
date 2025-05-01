import * as net from 'net';
import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  StreamInfo
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('StreamBlocks Language Server');
  context.subscriptions.push(outputChannel);

  const serverOptions = async (): Promise<StreamInfo> => {
    return new Promise((resolve, reject) => {
      const server = net.createServer((socket) => {
        outputChannel.appendLine("CAL language server: client connected.");
        resolve({ reader: socket, writer: socket });

        socket.on('end', () => {
          outputChannel.appendLine("CAL language server: client disconnected.");
        });
      });

      server.listen(() => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error("Failed to bind TCP server"));
          return;
        }

        const port = address.port.toString();
        const javaPath = findJavaExecutable('java');
        if (!javaPath) {
          vscode.window.showErrorMessage("Java not found in PATH or JAVA_HOME");
          reject(new Error("Java executable not found"));
          return;
        }

        const jarPath = path.resolve(
          context.extensionPath,
          '..',
          'streamblocks-tycho',
          'language-server',
          'target',
          'language-server-1.0-SNAPSHOT.jar'
        );

        const proc = child_process.spawn(javaPath, ['-jar', jarPath, port], {
          cwd: vscode.workspace.rootPath ?? undefined
        });

        proc.stdout.on('data', (data) => outputChannel.append(data.toString()));
        proc.stderr.on('data', (data) => outputChannel.append(data.toString()));
        proc.on('error', (err) => {
          outputChannel.appendLine("Failed to launch language server: " + err.message);
          reject(err);
        });

        outputChannel.appendLine(`Started CAL language server: java -jar ${jarPath} ${port}`);
      });
    });
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'cal' }],
    outputChannel,
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
    }
  };

  client = new LanguageClient(
    'streamblocksCAL',
    'CAL Language Server',
    serverOptions,
    clientOptions
  );

  context.subscriptions.push({ dispose: () => client.stop() });

  client.start().catch((err) => {
    outputChannel.appendLine('Error starting language client: ' + err.message);
  });
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}

function findJavaExecutable(binname: string): string | null {
  const javaHome = process.env['JAVA_HOME'];
  if (javaHome) {
    const candidate = path.join(javaHome, 'bin', binname);
    if (fs.existsSync(candidate)) return candidate;
  }

  const PATH = process.env['PATH'] || '';
  for (const p of PATH.split(path.delimiter)) {
    const candidate = path.join(p, binname);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}
