import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyNote, Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import { apiRequest } from '@/lib/queryClient';

interface Note {
  id: string;
  title: string;
  content: string;
  algorithmId: string;
  createdAt: string;
}

interface NoteEditorProps {
  algorithmId: string;
  notes: Note[];
  isAdmin: boolean;
}

export function NoteEditor({ algorithmId, notes, isAdmin }: NoteEditorProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editedNote, setEditedNote] = useState({ title: '', content: '' });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      const response = await fetch(`/api/algorithms/${algorithmId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminAuth.getAuthHeaders(),
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'notes'] });
      toast({ title: 'Note created successfully' });
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create note', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, noteData }: { noteId: string; noteData: { title: string; content: string } }) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...adminAuth.getAuthHeaders(),
        },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'notes'] });
      toast({ title: 'Note updated successfully' });
      setEditingNote(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update note', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'notes'] });
      toast({ title: 'Note deleted successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to delete note', 
        variant: 'destructive' 
      });
    },
  });

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({ 
        title: 'Please fill in both title and content', 
        variant: 'destructive' 
      });
      return;
    }
    createNoteMutation.mutate(newNote);
  };

  const handleUpdateNote = (noteId: string) => {
    if (!editedNote.title.trim() || !editedNote.content.trim()) {
      toast({ 
        title: 'Please fill in both title and content', 
        variant: 'destructive' 
      });
      return;
    }
    updateNoteMutation.mutate({ noteId, noteData: editedNote });
  };

  const handleDeleteNote = (noteId: string, title: string) => {
    if (confirm(`Are you sure you want to delete the note "${title}"?`)) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditedNote({ title: note.title, content: note.content });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
          <StickyNote className="w-5 h-5 mr-2 text-blue-600" />
          Study Notes
        </h3>
        {isAdmin && (
          <Button
            onClick={() => setIsAddingNote(true)}
            size="sm"
            variant="outline"
            data-testid="button-add-note"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add New Note Form */}
      {isAddingNote && isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Enter note title..."
                data-testid="input-note-title"
              />
            </div>
            <div>
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write your notes here..."
                rows={6}
                className="resize-none"
                data-testid="textarea-note-content"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleCreateNote}
                disabled={createNoteMutation.isPending}
                data-testid="button-save-note"
              >
                <Save className="w-4 h-4 mr-2" />
                {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ title: '', content: '' });
                }}
                data-testid="button-cancel-note"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notes */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card className="border-dashed border-neutral-300">
            <CardContent className="text-center py-8">
              <StickyNote className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">No notes yet</p>
              <p className="text-sm text-neutral-500">
                {isAdmin ? 'Click "Add Note" to create your first study note' : 'Admin can add notes here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  {editingNote === note.id ? (
                    <Input
                      value={editedNote.title}
                      onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                      className="font-semibold"
                      data-testid={`input-edit-title-${note.id}`}
                    />
                  ) : (
                    <CardTitle className="text-lg text-neutral-800">
                      {note.title}
                    </CardTitle>
                  )}
                  {isAdmin && (
                    <div className="flex space-x-2">
                      {editingNote === note.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={updateNoteMutation.isPending}
                            data-testid={`button-save-edit-${note.id}`}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNote(null)}
                            data-testid={`button-cancel-edit-${note.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(note)}
                            data-testid={`button-edit-note-${note.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id, note.title)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingNote === note.id ? (
                  <Textarea
                    value={editedNote.content}
                    onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
                    rows={6}
                    className="resize-none"
                    data-testid={`textarea-edit-content-${note.id}`}
                  />
                ) : (
                  <div className="text-neutral-700 whitespace-pre-wrap">
                    {note.content}
                  </div>
                )}
                <div className="mt-4 text-xs text-neutral-500 border-t pt-2">
                  Created: {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}