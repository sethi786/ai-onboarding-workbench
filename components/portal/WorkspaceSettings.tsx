'use client';

import { useState } from 'react';
import { renameWorkspace } from '@/lib/actions/workspace';
import { useGovernanceSave } from './useGovernanceSave';
import { useDirtyForm } from './UnsavedChanges';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function WorkspaceSettings({
  orgSlug,
  initialName,
  editable,
}: {
  orgSlug: string;
  initialName: string;
  editable: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  useDirtyForm(name.trim() !== saved);
  const { save, pending, error } = useGovernanceSave();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        save(
          () => renameWorkspace(orgSlug, name),
          () => {
            setSaved(name.trim());
            setName(name.trim());
          },
        );
      }}
    >
      <div>
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          required
          maxLength={120}
          value={name}
          disabled={!editable || pending}
          onChange={(event) => setName(event.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Your workspace address and existing assessment links stay the same.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={pending || !name.trim() || name.trim() === saved}
          >
            {pending ? 'Saving…' : 'Save workspace'}
          </Button>
          <p role="status" className="text-xs text-muted-foreground">
            {name.trim() === saved
              ? 'Workspace name is saved.'
              : 'Unsaved name change'}
          </p>
        </div>
      )}
    </form>
  );
}
