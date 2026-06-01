const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/app/ChatPage.tsx');
let source = fs.readFileSync(filePath, 'utf8');

if (source.includes('const canonicalMessageId = event.assistant_message_id;')) {
  console.log('[patch-chat-canonical-content] patch already applied');
  process.exit(0);
}

const target = `            if (event.done) {
              // Capture message IDs from the done event if available
              if (event.user_message_id || event.assistant_message_id) {
`;

const replacement = `            if (event.done) {
              // Ao finalizar o stream, buscar a mensagem canônica salva no banco.
              // Isso corrige qualquer corrupção/truncamento visual ocorrido durante SSE.
              const canonicalMessageId = event.assistant_message_id;
              if (canonicalMessageId) {
                supabase
                  .from('messages')
                  .select('content')
                  .eq('id', canonicalMessageId)
                  .single()
                  .then(({ data }) => {
                    if (data?.content) {
                      assistantContent = data.content;
                      setMessages(prev => {
                        const copy = [...prev];
                        copy[copy.length - 1] = {
                          ...copy[copy.length - 1],
                          role: 'assistant',
                          content: data.content,
                        };
                        return copy;
                      });
                    }
                  });
              }

              // Capture message IDs from the done event if available
              if (event.user_message_id || event.assistant_message_id) {
`;

if (!source.includes(target)) {
  console.error('[patch-chat-canonical-content] target block not found');
  process.exit(1);
}

source = source.replace(target, replacement);
fs.writeFileSync(filePath, source);
console.log('[patch-chat-canonical-content] patch applied');
