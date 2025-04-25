const allChats = v.allchats;

const tab = v.active_inbox_tab;
const isClosed = i.toggle_inboxfilters_closed;
const isOpen = !isClosed;
const isUnprocessed = i.toggle_inboxfilters_new;
const filters = v.realTimeFilters;

const filteredChats = allChats.filter(chat => {
  if (tab === 'nieuw') {
    if (!chat.open || chat.livechat) return false;
  }

  if (tab === 'alles') {
    if (chat.open !== isOpen) return false;
  }

  if (tab === 'voorjou') {
    const isOperator = chat.operators?.some(o => ['active', 'invited'].includes(o.status));
    if (!isOperator) return false;

    const isInvited = chat.operators?.some(o => o.status === 'invited');
    if (isInvited) return true;

    if (!isUnprocessed) {
      if (!chat.open) return false;

      const lastMsg = [...(chat.messages || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      if (!lastMsg) return false;

      const type = lastMsg.message_type;
      const createdAt = new Date(lastMsg.created_at);
      //   const nowMinus3min = new Date(Date.now() - 3 * 60 * 1000);

      if (['chat_opened', 'chat_closed', 'operator_changed', 'default_agent'].includes(type)) return false;
      //   if (['operator_changed', 'default_agent'].includes(type) && createdAt <= nowMinus3min) return false;
    }
  }

  // filtering conditions

  if (filters.chatbots?.enabled && !filters.chatbots.value.includes(chat.chatbot_id)) return false;

  if (filters.livechat?.enabled && chat.livechat !== filters.livechat.value) return false;

  if (filters.assigned?.enabled) {
    const isAssigned = chat.operators?.some(o => o.status === 'invited');
    if (filters.assigned.value && !isAssigned) return false;
    if (!filters.assigned.value && isAssigned) return false;
  }

  if (filters.read?.enabled && chat.has_unread !== !filters.read.value) return false;

  if (filters.containstext?.enabled) {
    const text = filters.containstext.value.toLowerCase();
    const includesText = str => str?.toLowerCase().includes(text);

    const matchesText =
      includesText(chat.name) ||
      includesText(chat.id) ||
      includesText(chat.chat_user_email) ||
      includesText(chat.enduser_email) ||
      includesText(chat.enduser_phone) ||
      includesText(chat.chat_user_phone) ||
      Object.values(chat.custom_fields || {}).some(v => includesText(v)) ||
      (chat.messages || []).some(m => includesText(m.body));

    if (!matchesText) return false;
  }

  return true;
});

return filteredChats;
