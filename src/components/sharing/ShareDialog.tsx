import { useMemo, useState } from 'react';
import { Check, Copy, Link as LinkIcon, Mail, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCodaStore } from '../../store/useCodaStore';
import type { SharePermission, ShareTargetType } from '../type/typeScript';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Separator } from '../ui/Separator';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ShareTargetType;
  targetId: string;
  docId: string;
  title: string;
}

export const ShareDialog = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  docId,
  title,
}: ShareDialogProps) => {
  const { shares, addShare, removeShare, updateSharePermission } = useCodaStore();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [copied, setCopied] = useState(false);

  const targetShares = useMemo(
    () => shares.filter((share) => share.targetType === targetType && share.targetId === targetId),
    [shares, targetId, targetType]
  );

  const shareUrl = `${window.location.origin}/doc/${docId}${
    targetType === 'page' ? `?page=${targetId}` : ''
  }`;

  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Enlace copiado');
    window.setTimeout(() => setCopied(false), 1500);
  };

  const invite = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    addShare({
      targetType,
      targetId,
      docId,
      title,
      email: trimmedEmail,
      permission,
    });
    setEmail('');
    toast.success('Invitacion guardada');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Compartir ${targetType === 'workspace' ? 'puesto de trabajo' : 'pagina'}`}
      description={title}
    >
      <div className="space-y-5">
        <div className="flex gap-2">
          <Input
            icon={<Mail size={15} />}
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') invite();
            }}
          />
          <select
            value={permission}
            onChange={(event) => setPermission(event.target.value as SharePermission)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
          >
            <option value="view">Ver</option>
            <option value="edit">Editar</option>
          </select>
          <Button onClick={invite}>Invitar</Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LinkIcon size={15} />
            Enlace de acceso
          </div>
          <div className="flex gap-2">
            <Input readOnly value={shareUrl} className="bg-white" />
            <Button variant="outline" onClick={copyShareUrl} icon={copied ? <Check size={15} /> : <Copy size={15} />}>
              Copiar
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users size={15} />
            Personas con acceso
          </div>
          {targetShares.length > 0 ? (
            <div className="space-y-2">
              {targetShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                    {share.email.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-950">{share.email}</p>
                    <p className="text-xs text-slate-500">Invitado localmente</p>
                  </div>
                  <select
                    value={share.permission}
                    onChange={(event) => updateSharePermission(share.id, event.target.value as SharePermission)}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                  >
                    <option value="view">Ver</option>
                    <option value="edit">Editar</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeShare(share.id)}
                    aria-label="Quitar acceso"
                  >
                    <Trash2 size={15} className="text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
              Todavia no hay personas invitadas.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
};
