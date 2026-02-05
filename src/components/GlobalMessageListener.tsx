import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function GlobalMessageListener() {
  const userId = window.getGlobal ? window.getGlobal('userid') : null;
  const lastMessageRef = useRef<number>(0);

  // Initialize lastMessageRef to the latest message on mount
  useEffect(() => {
    if (!userId) return;

    const initLastMessage = async () => {
      try {
        const { data: latestMessage, error } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', userId)
          .order('id', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error initializing last message:', error);
          lastMessageRef.current = 0; // fallback
          return;
        }

        lastMessageRef.current = latestMessage?.id || 0;
      } catch (err) {
        console.error('Initialization error:', err);
        lastMessageRef.current = 0;
      }
    };

    initLastMessage();
  }, [userId]);

  // Polling for new messages
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', userId)
          .gt('id', lastMessageRef.current)
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        if (data?.length) {
          for (const msg of data) {
            const { data: sender, error: senderError } = await supabase
              .from('users')
              .select('fullname')
              .eq('userid', msg.sender_id)
              .single();

            if (senderError) {
              console.error('Error fetching sender:', senderError);
            }

            toast({
              title: 'New Message',
              description: `From ${sender?.fullname || 'Someone'}: ${msg.content}`,
              duration: 4000,
            });

            const audio = new Audio('/sounds/notif.mp3');
            audio.play().catch((e) => console.error('Audio play failed:', e));

            lastMessageRef.current = Math.max(lastMessageRef.current, msg.id);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, [userId]);

  return null;
}
