import * as vscode from "vscode";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "file-content-copier.copyContents",
    async (uri: vscode.Uri, uris: vscode.Uri[]) => {
      // If multiple items are selected, use those. Otherwise, use the single item.
      const itemsToCopy = uris && uris.length > 0 ? uris : [uri];

      if (itemsToCopy && itemsToCopy.length > 0) {
        let allContents = "";
        let fileCount = 0;

        for (const item of itemsToCopy) {
          try {
            const stat = await vscode.workspace.fs.stat(item);
            if (stat.type === vscode.FileType.Directory) {
              const folderContents = await processFolder(item);
              allContents += folderContents.content;
              fileCount += folderContents.count;
            } else if (stat.type === vscode.FileType.File) {
              const content = await vscode.workspace.fs.readFile(item);
              allContents += `File: ${
                item.fsPath
              }\n\n${content.toString()}\n\n`;
              fileCount++;
            }
          } catch (error) {
            vscode.window.showErrorMessage(
              `Error processing ${item.fsPath}: ${error}`
            );
          }
        }

        if (allContents) {
          await vscode.env.clipboard.writeText(allContents);
          vscode.window.showInformationMessage(
            `Contents of ${fileCount} file(s) copied to clipboard!`
          );
        } else {
          vscode.window.showWarningMessage("No file contents were copied.");
        }
      } else {
        vscode.window.showWarningMessage("No items selected to copy.");
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function processFolder(
  folderUri: vscode.Uri
): Promise<{ content: string; count: number }> {
  let content = "";
  let count = 0;
  const entries = await vscode.workspace.fs.readDirectory(folderUri);

  for (const [name, type] of entries) {
    const itemUri = vscode.Uri.joinPath(folderUri, name);
    if (type === vscode.FileType.Directory) {
      const subFolderResult = await processFolder(itemUri);
      content += subFolderResult.content;
      count += subFolderResult.count;
    } else if (type === vscode.FileType.File) {
      const fileContent = await vscode.workspace.fs.readFile(itemUri);
      content += `File: ${itemUri.fsPath}\n\n${fileContent.toString()}\n\n`;
      count++;
    }
  }

  return { content, count };
}

export function deactivate() {}
