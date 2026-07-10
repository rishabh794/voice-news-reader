import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCollections, createCollection } from '../services/api';
import type { Collection } from '../types/news';
import Button from './ui/Button';
import Input from './ui/Input';
import Loader from './Loader';
import Icon from './ui/Icon';

const AVAILABLE_ICONS = ['Folder', 'Library', 'BookOpen', 'Star', 'Bookmark', 'Briefcase', 'Coffee', 'Heart'];

interface SaveToCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCollection: (collectionId: string) => void;
}

const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({ isOpen, onClose, onSelectCollection }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionIcon, setNewCollectionIcon] = useState('Folder');
    const queryClient = useQueryClient();

    const { data: collections = [], isLoading } = useQuery<Collection[]>({
        queryKey: ['collections'],
        queryFn: fetchCollections,
        enabled: isOpen
    });

    const createMutation = useMutation({
        mutationFn: () => createCollection(newCollectionName, newCollectionIcon),
        onSuccess: (newCol) => {
            queryClient.setQueryData<Collection[]>(['collections'], (old = []) => [...old, newCol]);
            setIsCreating(false);
            setNewCollectionName('');
            setNewCollectionIcon('Folder');
            onSelectCollection(newCol._id);
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4" onClick={onClose}>
            <div 
                className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-card-foreground">Save to Collection</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none">&times;</button>
                </div>
                
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><Loader /></div>
                    ) : (
                        <div className="space-y-2">
                            {collections.map(col => (
                                <button
                                    key={col._id}
                                    onClick={() => onSelectCollection(col._id)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform">
                                        <Icon name={col.icon} size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-foreground">{col.name}</h3>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-muted-foreground">
                                        <Icon name="ChevronRight" size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-border bg-muted/20">
                    {isCreating ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input 
                                        className="w-full"
                                        placeholder="Collection name..."
                                        value={newCollectionName}
                                        onChange={e => setNewCollectionName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Select an icon</p>
                                <div className="flex gap-2 flex-wrap">
                                    {AVAILABLE_ICONS.map(iconName => (
                                        <button
                                            key={iconName}
                                            onClick={() => setNewCollectionIcon(iconName)}
                                            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                                                newCollectionIcon === iconName ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/80'
                                            }`}
                                        >
                                            <Icon name={iconName} size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button 
                                    variant="primary" 
                                    disabled={!newCollectionName.trim() || createMutation.isPending}
                                    onClick={() => createMutation.mutate()}
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create & Save'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            variant="ghost" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => setIsCreating(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create New Collection
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaveToCollectionModal;
