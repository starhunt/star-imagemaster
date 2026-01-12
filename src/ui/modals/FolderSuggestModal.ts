import { App, FuzzySuggestModal, TFolder } from 'obsidian';

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  private folders: TFolder[];
  private onChoose: (folder: TFolder | null) => void;

  constructor(app: App, onChoose: (folder: TFolder | null) => void) {
    super(app);
    this.onChoose = onChoose;
    this.folders = this.getAllFolders();
    this.setPlaceholder('Select a folder to move images to...');
  }

  private getAllFolders(): TFolder[] {
    const folders: TFolder[] = [];
    const rootFolder = this.app.vault.getRoot();

    const collectFolders = (folder: TFolder) => {
      folders.push(folder);
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          collectFolders(child);
        }
      }
    };

    collectFolders(rootFolder);
    return folders;
  }

  getItems(): TFolder[] {
    return this.folders;
  }

  getItemText(folder: TFolder): string {
    return folder.path || '/';
  }

  onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.onChoose(folder);
  }

  onClose(): void {
    // If modal closed without selection, call with null
    // Note: onChooseItem is called before onClose when an item is selected
  }
}

// Helper function to open the modal and return a promise
export function selectFolder(app: App): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const modal = new FolderSuggestModal(app, (folder) => {
      resolved = true;
      resolve(folder ? folder.path : null);
    });

    // Handle close without selection
    const originalOnClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalOnClose();
      if (!resolved) {
        resolve(null);
      }
    };

    modal.open();
  });
}
