import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCollection } from '../services/api';
import type { Collection } from '../types/news';
import Button from './ui/Button';
import Input from './ui/Input';
import Icon from './ui/Icon';

const AVAILABLE_ICONS = ['Folder', 'Library', 'BookOpen', 'Star', 'Bookmark', 'Briefcase', 'Coffee', 'Heart'];

interface CreateCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Folder');
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: () => createCollection(name, icon),
        onSuccess: (newCol) => {
            queryClient.setQueryData<Collection[]>(['collections'], (old = []) => [...old, newCol]);
            setName('');
            setIcon('Folder');
            onClose();
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4" onClick={onClose}>
            <div 
                className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                    <h2 className="text-xl font-semibold text-card-foreground">Create New Collection</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-5 space-y-5 bg-card">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Collection Name</label>
                        <Input 
                            className="w-full"
                            placeholder="e.g., Tech News, Read Later..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Select Icon</label>
                        <div className="flex gap-2 flex-wrap">
                            {AVAILABLE_ICONS.map(iconName => (
                                <button
                                    key={iconName}
                                    onClick={() => setIcon(iconName)}
                                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                                        icon === iconName 
                                            ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                    }`}
                                >
                                    <Icon name={iconName} size={22} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        disabled={!name.trim() || createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                    >
                        {createMutation.isPending ? 'Creating...' : 'Create Collection'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateCollectionModal;
