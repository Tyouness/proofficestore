'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender_role: 'user' | 'admin';
  content: string;
  created_at: string;
  attachment_url?: string | null;
  file_type?: 'image' | 'pdf' | null;
}

interface AdminTicketClientProps {
  ticketId: string;
  adminId: string;
  initialMessages: Message[];
  initialTicketMessage: string | null;
  isClosed: boolean;
}

export default function AdminTicketClient({
  ticketId,
  adminId,
  initialMessages,
  initialTicketMessage,
  isClosed,
}: AdminTicketClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime: Écouter les nouveaux messages du client
  useEffect(() => {
    // Import supabase client
    const createSupabaseClient = async () => {
      const { supabase } = await import('@/lib/supabase/client');
      
      const channel = supabase
        .channel(`admin-ticket-${ticketId}`)
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
            console.log('[ADMIN REALTIME] Nouveau message reçu:', newMsg);
            
            // Vérifier la présence des pièces jointes
            if (newMsg.attachment_url) {
              console.log('[ADMIN REALTIME] Message avec pièce jointe:', {
                attachment_url: newMsg.attachment_url,
                file_type: newMsg.file_type,
              });
            }
            
            // Ne pas ajouter si c'est notre propre message (déjà ajouté en optimistic)
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === newMsg.id);
              if (exists) {
                console.log('[ADMIN REALTIME] Message déjà présent, ignoré');
              }
              return exists ? prev : [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return channel;
    };

    let channel: any;
    createSupabaseClient().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        import('@/lib/supabase/client').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [ticketId]);

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
      const { supabase } = await import('@/lib/supabase/client');
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

    setError('');
    setSuccess('');
    setLoading(true);

    const messageContent = newMessage.trim();
    const currentFile = selectedFile;
    const tempId = `temp-${Date.now()}`;

    // Optimistic update avec fichier si présent
    const optimisticMessage: Message = {
      id: tempId,
      sender_role: 'admin',
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
        const uploaded = await uploadFile(currentFile);
        if (!uploaded) {
          throw new Error('Échec de l\'upload du fichier');
        }
        attachmentData = uploaded;
        console.log('[ADMIN] Fichier uploadé avec succès:', attachmentData);
      }

      // Vérification critique : si fichier présent, URL doit exister
      if (currentFile && !attachmentData?.url) {
        throw new Error('URL du fichier manquante après upload');
      }

      const messagePayload = {
        ticketId,
        adminId,
        content: messageContent || '',
        attachment_url: attachmentData?.url || null,
        file_type: attachmentData?.type || null,
      };

      console.log('[ADMIN] Envoi du message avec données:', messagePayload);

      // Insertion via API avec attachment_url et file_type
      const response = await fetch('/api/admin/tickets/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      const result = await response.json();

      console.log('[ADMIN] Réponse de l\'API:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message');
      }

      // Vérifier que les pièces jointes sont bien présentes dans la réponse
      if (attachmentData && result.message && !result.message.attachment_url) {
        console.error('[ADMIN] ERREUR: attachment_url manquant dans la réponse:', result.message);
        throw new Error('La pièce jointe n\'a pas été sauvegardée correctement');
      }

      // Remplacer le message temporaire par le vrai
      if (result.message) {
        console.log('[ADMIN] Message confirmé avec succès:', result.message);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? result.message : m))
        );
      }

      setSuccess('Message envoyé avec succès');
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      // Rollback complet en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageContent);
      setSelectedFile(currentFile);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Êtes-vous sûr de vouloir fermer ce ticket ?')) {
      return;
    }

    setError('');
    setSuccess('');
    setClosingTicket(true);

    try {
      const response = await fetch('/api/admin/tickets/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Erreur lors de la fermeture du ticket');
        setClosingTicket(false);
        return;
      }

      setSuccess('Ticket fermé avec succès');
      
      // Refresh pour mettre à jour le statut
      router.refresh();
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setClosingTicket(false);
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
    <div className="space-y-4">
      {/* Messages */}
      <div
        className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
        style={{ height: '600px' }}
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Message initial du ticket */}
          {initialTicketMessage && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-blue-50 text-gray-900 border border-blue-200 rounded-bl-sm">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {initialTicketMessage}
                </p>
                <p className="text-xs mt-1 text-blue-600">
                  <span className="font-medium">· Client (message initial)</span>
                </p>
              </div>
            </div>
          )}

          {/* Messages de la conversation */}
          {messages.length === 0 && !initialTicketMessage ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>Aucun message pour le moment</p>
              <p className="text-sm">L'utilisateur n'a pas encore envoyé de message</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_role === 'admin' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender_role === 'admin'
                      ? 'bg-gray-700 text-white rounded-br-sm'
                      : 'bg-blue-50 text-gray-900 border border-blue-200 rounded-bl-sm'
                  }`}
                >
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  
                  {/* Affichage des pièces jointes */}
                  {message.attachment_url && message.file_type === 'image' && (
                    <div className="mt-2">
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={message.attachment_url}
                          alt="Pièce jointe"
                          className="rounded-lg max-h-[300px] object-contain"
                        />
                      </a>
                    </div>
                  )}
                  
                  {message.attachment_url && message.file_type === 'pdf' && (
                    <div className="mt-2">
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                          message.sender_role === 'admin'
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-blue-100 hover:bg-blue-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">📄 Télécharger PDF</span>
                      </a>
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_role === 'admin'
                        ? 'text-gray-300'
                        : 'text-blue-600'
                    }`}
                  >
                    {formatTime(message.created_at)}
                    {message.sender_role === 'user' && (
                      <span className="ml-2 font-medium">· Client</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulaire de réponse */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
                <p className="text-sm">{success}</p>
              </div>
            )}

            {/* Prévisualisation du fichier sélectionné */}
            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-blue-600">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
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
                disabled={loading || isClosed}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Joindre un fichier (JPG, PNG, WEBP, PDF - max 5 MB)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Répondre au client..."
                disabled={loading || isClosed}
                rows={3}
                maxLength={2000}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || (!newMessage.trim() && !selectedFile) || isClosed}
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
                  'Répondre'
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{newMessage.length} / 2000 caractères</span>
              {isClosed && (
                <span className="text-yellow-700 font-medium">
                  ⚠️ Ticket fermé - réponse désactivée
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Actions admin */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isClosed ? (
              <span className="text-gray-500">
                ✓ Ce ticket est fermé
              </span>
            ) : (
              <span>
                Actions administrateur
              </span>
            )}
          </div>
          <button
            onClick={handleCloseTicket}
            disabled={closingTicket || isClosed}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closingTicket ? 'Fermeture...' : isClosed ? 'Ticket fermé' : 'Fermer le ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
