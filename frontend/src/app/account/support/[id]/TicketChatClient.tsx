'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Message {
  id: string;
  sender_role: 'user' | 'admin';
  content: string;
  created_at: string;
  attachment_url?: string | null;
  file_type?: 'image' | 'pdf' | null;
}

interface TicketChatClientProps {
  ticketId: string;
  userId: string;
  initialMessages: Message[];
  initialTicketMessage: string | null;
  isClosed: boolean;
}

export default function TicketChatClient({
  ticketId,
  userId,
  initialMessages,
  initialTicketMessage,
  isClosed,
}: TicketChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll au chargement et après envoi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime: Écouter les nouveaux messages
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log('[CLIENT REALTIME] Nouveau message reçu:', newMsg);
          
          // Vérifier la présence des pièces jointes
          if (newMsg.attachment_url) {
            console.log('[CLIENT REALTIME] Message avec pièce jointe:', {
              attachment_url: newMsg.attachment_url,
              file_type: newMsg.file_type,
            });
          }
          
          // Déduplication : ne pas ajouter si déjà présent
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              console.log('[CLIENT REALTIME] Message déjà présent, ignoré');
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation flexible : texte OU fichier
    if (!newMessage.trim() && !selectedFile) {
      setError('Veuillez écrire un message ou joindre un fichier');
      return;
    }

    if (newMessage.trim().length > 2000) {
      setError('Le message ne peut pas dépasser 2000 caractères');
      return;
    }

    if (isClosed) {
      setError('Ce ticket est fermé, vous ne pouvez plus envoyer de messages');
      return;
    }

    setError('');
    setLoading(true);
    setUploadProgress(0);

    const messageContent = newMessage.trim();
    const currentFile = selectedFile;
    const tempId = `temp-${Date.now()}`;

    // Optimistic update avec fichier si présent
    const optimisticMessage: Message = {
      id: tempId,
      sender_role: 'user',
      content: messageContent || '',
      attachment_url: currentFile ? URL.createObjectURL(currentFile) : null,
      file_type: currentFile ? (currentFile.type.startsWith('image/') ? 'image' : 'pdf') : null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      let attachmentData = null;

      // Upload séquentiel : fichier d'abord
      if (currentFile) {
        setUploadProgress(50);
        const uploaded = await uploadFile(currentFile);
        if (!uploaded) {
          throw new Error('Échec de l\'upload du fichier');
        }
        attachmentData = uploaded;
        setUploadProgress(75);
        console.log('[CLIENT] Fichier uploadé avec succès:', attachmentData);
      }

      // Vérification critique : si fichier présent, URL doit exister
      if (currentFile && !attachmentData?.url) {
        throw new Error('URL du fichier manquante après upload');
      }

      const messageData = {
        ticket_id: ticketId,
        sender_id: userId,
        sender_role: 'user',
        content: messageContent || '',
        attachment_url: attachmentData?.url || null,
        file_type: attachmentData?.type || null,
      };

      console.log('[CLIENT] Envoi du message avec données:', messageData);

      // Insertion en base avec attachment_url et file_type
      const { data, error: insertError } = await supabase
        .from('support_messages')
        .insert(messageData)
        .select('id, sender_role, content, attachment_url, file_type, created_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('[CLIENT] Message inséré avec succès:', data);
      
      // Vérifier que les pièces jointes sont bien présentes dans la réponse
      if (attachmentData && !data.attachment_url) {
        console.error('[CLIENT] ERREUR: attachment_url manquant dans la réponse:', data);
        throw new Error('La pièce jointe n\'a pas été sauvegardée correctement');
      }

      setUploadProgress(100);

      // Remplacer le message temporaire par le vrai
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data as Message) : m))
      );
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      // Rollback complet en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageContent);
      setSelectedFile(currentFile);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, WEBP ou PDF.');
      return;
    }

    // Validation de la taille (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: 'image' | 'pdf' } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${ticketId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);

      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
      return { url: publicUrl, type: fileType };
    } catch (err) {
      setError('Erreur lors de l\'upload du fichier');
      return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ height: '600px' }}>
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {/* Message initial du ticket */}
        {initialTicketMessage && (
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-blue-600 text-white rounded-br-sm">
              <p className="text-sm whitespace-pre-wrap break-words">
                {initialTicketMessage}
              </p>
              <p className="text-xs mt-1 text-blue-100">
                <span className="font-medium">· Vous (message initial)</span>
              </p>
            </div>
          </div>
        )}

        {/* Messages de la conversation */}
        {messages.length === 0 && !initialTicketMessage ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Commencez la conversation ci-dessous</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender_role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {message.attachment_url && message.file_type === 'image' && (
                  <div className="mb-2">
                    <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={message.attachment_url} 
                        alt="Image jointe" 
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                        style={{ maxHeight: '300px' }}
                      />
                    </a>
                  </div>
                )}
                {message.attachment_url && message.file_type === 'pdf' && (
                  <div className="mb-2 flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v13H2z"/>
                    </svg>
                    <a 
                      href={message.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm underline hover:no-underline"
                    >
                      Télécharger le PDF
                    </a>
                  </div>
                )}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
                <p
                  className={`text-xs mt-1 ${
                    message.sender_role === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                  {message.sender_role === 'admin' && (
                    <span className="ml-2 font-medium">· Support</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulaire d'envoi */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {isClosed ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800">
              🔒 Ce ticket est fermé. Vous ne pouvez plus envoyer de messages.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v13H2z"/>
                  </svg>
                  <span className="text-sm text-blue-900">{selectedFile.name}</span>
                  <span className="text-xs text-blue-600">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Retirer
                </button>
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Joindre un fichier (JPG, PNG, WEBP, PDF)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                disabled={loading}
                rows={3}
                maxLength={2000}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || (!newMessage.trim() && !selectedFile)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Envoi...</span>
                  </>
                ) : (
                  'Envoyer'
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                {newMessage.length} / 2000 caractères
              </span>
              <span>
                Appuyez sur Envoyer pour publier votre message
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
