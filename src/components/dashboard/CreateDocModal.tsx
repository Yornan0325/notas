import { useState } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';

export const CreateDocModal = ({
  isOpen,
  onClose,
  onCreate,
  title = 'Nuevo documento',
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  title?: string;
}) => {
  const [documentTitle, setDocumentTitle] = useState('');

  const createDoc = () => {
    const trimmedTitle = documentTitle.trim();
    if (!trimmedTitle) return;

    onCreate(trimmedTitle);
    setDocumentTitle('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description="Crea un documento con paginas, bloques e imagenes."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={createDoc}>Crear documento</Button>
        </>
      }
    >
      <Input
        autoFocus
        type="text"
        placeholder="Titulo del documento"
        value={documentTitle}
        onChange={(event) => setDocumentTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') createDoc();
        }}
      />
    </Dialog>
  );
};
