import React, { useState, useRef, useEffect } from 'react';
import { Send, Video, MoreVertical, Search, Paperclip, Smile, Edit, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

interface Contact {
  id: number | string;
  name: string;
  company?: string;
  email:string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  online?: boolean;
}

const MessagingUI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [supabaseContacts, setSupabaseContacts] = useState<Contact[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesMap, setMessagesMap] = useState<{ [contactId: string]: Message[] }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
  if (!selectedContact) return;
    setMessages(messagesMap[selectedContact.id] || []);
}, [selectedContact, messagesMap]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedContact) return;

    const sender = window.getGlobal ? window.getGlobal('userid') : null
    if (!sender) {
        console.error('Sender ID is missing. Cannot proceed.');
        return; // stop execution if sender is required
        }
    
    const { data, error } = await supabase
        .from('messages')
        .insert([
        {
            sender_id: sender,
            receiver_id: selectedContact.id.toString(),
            content: inputText.trim(),
        },
        ])
        .select();

    if (error) {
        console.error('Error sending message:', error.message);
    } else {
        setMessages((prev) => [
        ...prev,
        {
            id: data[0].id,
            text: data[0].content,
            sender: 'user',
            timestamp: new Date(data[0].created_at),
        },
        ]);
    }

    setInputText('');
    };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!showNewMessageModal) return;

      const { data, error } = await supabase
        .from('users')
        .select('userid, fullname, company,email');

      if (error) {
        console.error('Error fetching users:', error.message);
        return;
      }

      const formatted = data.map((u: any) => ({
        id: u.userid,
        name: u.fullname || '(No Name)',
        company: u.company,
        email: u.email,
      }));

      setSupabaseContacts(formatted);
    };

    fetchUsers();
  }, [showNewMessageModal]);

  const filteredContacts = supabaseContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartNewChat = (contact: Contact) => {
    setSelectedContact(contact);
    setShowNewMessageModal(false);
    setSearchQuery('');
    if (!contacts.find(c => c.id === contact.id)) {
      setContacts(prev => [...prev, contact]);
    }
    fetchMessagesForContact(contact);
  };

    useEffect(() => {
      fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const userId = window.getGlobal ? window.getGlobal('userid') : null;
        if (!userId) {
        console.error('User ID is missing.');
        return;
        }

        try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            is_read,
            read_at,
            sender:sender_id(fullname, company, email),
            receiver:receiver_id(fullname, company, email)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(500); // adjust as needed

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }
        if (!messages || messages.length === 0) {
            setContacts([]);
            return;
        }

        // Reduce to latest message per contact (other party)
        const conversationMap: Record<string, any> = {};
        const unreadCountMap: Record<string, number> = {};


        for (const msg of messages) {
            const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            // If we've already recorded a message for this otherId, skip because messages are ordered newest first
            if (!conversationMap[otherId]) {
            conversationMap[otherId] = msg;
            }

            // Count unread messages (only those sent *to* current user)
            if (msg.receiver_id === userId && !msg.is_read) {
              unreadCountMap[otherId] = (unreadCountMap[otherId] || 0) + 1;
            }
        }

        // Convert to array and map to contact structure
        const conversations = Object.values(conversationMap).map((msg: any) => {
        const isSender = msg.sender_id === userId;
        const otherId = isSender ? msg.receiver_id : msg.sender_id;

        // Determine which user info to use based on who you are
        const otherUserInfo = isSender
          ? msg.receiver  // when you are the sender, use receiver info
          : msg.sender;   // when you are the receiver, use sender info

        return {
          id: otherId,
          name: otherUserInfo?.fullname || 'Unknown',
          company: otherUserInfo?.company || '',
          email: otherUserInfo?.email || '',
          lastMessage: msg.content,
          created_at: msg.created_at,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: unreadCountMap[otherId] || 0,
        };
      });


        // Sort by created_at descending (newest first)
        conversations.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setContacts(conversations);
        } catch (err) {
        console.error('Unexpected error fetching conversations:', err);
        }
    };
    const fetchMessagesForContact = async (contact: Contact) => {
        const userId = window.getGlobal ? window.getGlobal('userid') : null;
        if (!userId) return;

        const { data, error } = await supabase
            .from('messages')
            .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            is_read
            `)
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages for contact:', error.message);
            return;
        }
        // if (data) {
            const formatted = data.map((msg: any) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === userId ? 'user' : 'other',
            timestamp: new Date(msg.created_at),
            isRead: msg.is_read,
        }));
        // }
        

        setMessages(formatted);

        const unreadIds = data
          .filter((m: any) => m.receiver_id === userId && !m.is_read)
          .map((m: any) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString()
              })
            .in('id', unreadIds);
        }

        setContacts(prev =>
          prev.map(c =>
            c.id === contact.id ? { ...c, unread: 0 } : c
          )
        );
        };



useEffect(() => {
  if (!selectedContact) return;

  const interval = setInterval(() => {
    (async () => {
      // optional: you probably don't want to set it again
      // setSelectedContact(selectedContact);
      await fetchMessagesForContact(selectedContact);
    })();
  }, 1000); // runs every 1 second

  return () => clearInterval(interval); // cleanup on unmount
}, [selectedContact]);


useEffect(() => {
  const interval = setInterval(() => {
    (async () => {
      await fetchConversations();
    })();
  }, 1000); // refresh every 2 seconds (you can adjust to 3000 or 5000 if needed)

  return () => clearInterval(interval); // cleanup
}, []);




  return (
    <div className="flex flex-col flex-1 bg-gray-800 relative rounded-2xl overflow-hidden shadow-lg mb-4 mx-4">
      {/* Layout inside the card: left column (sidebar) and right column (chat) */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r flex flex-col">
          <div className="p-4 border-b ">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[#f5f5f5]">Messages</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
                  title="New Message"
                >
                  <Edit size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical size={20} className="text-[#f5f5f5]" />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSearchQuery(e.target.value)}
                value={searchQuery}
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                   onClick={async () => {
                    setSelectedContact(contact);
                    await fetchMessagesForContact(contact); // await fetching messages
                  }}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-700 ${
                    selectedContact?.id === contact.id ? 'bg-blue-800' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(contact.name)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#f5f5f5] truncate flex items-center justify-between">
                      <span>{contact.name}</span>
                      {contact.unread > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {contact.unread}
                        </span>
                      )}
                    </h3>
                    {contact.lastMessage && (
                      <p className="text-sm text-[#ababab] truncate">{contact.lastMessage}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">No conversations yet</div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-700 border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {getInitials(selectedContact.name)}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#f5f5f5]">{selectedContact.name}</h2>
                    <p className="text-sm text-green-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="no-scrollbar flex-1 overflow-y-auto p-4 space-y-4 bg-gray-700 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-[#f5f5f5] rounded-br-none'
                          : 'bg-gray-300 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="break-words">{message.text}</p>
                      <span
                        className={`text-xs mt-1 block ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-gray-700 border-t border-gray-200 p-4">
                <div className="flex items-end gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Paperclip size={20} className="text-[#f5f5f5]" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 pr-12 rounded-lg text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={1}
                      style={{ maxHeight: '120px' }}
                    />
                    <button className="absolute right-3 bottom-3 p-1 hover:bg-gray-200 rounded-full">
                      <Smile size={20} className="text-gray-600" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a contact to start chatting
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartNewChat(contact)}
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {getInitials(contact.name)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <p className="text-sm text-gray-500">
                        {contact.email || ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">No contacts found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingUI;
