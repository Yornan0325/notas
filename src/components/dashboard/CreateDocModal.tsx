import { useState } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';

export const CreateDocModal = ({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}) => {
  const [title, setTitle] = useState('');

  const createDoc = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onCreate(trimmedTitle);
    setTitle('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Nuevo documento"
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
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') createDoc();
        }}
      />
    </Dialog>
  );
};
