(async function initInbox() {
  // window.Wized = window.Wized || [];
  // window.Wized.push(async Wized => {

  const v = Wized.data.v;
  const r = Wized.data.r;
  const i = Wized.data.i;

  let supabase;
  const { version, client } = await Wized.requests.getClient('supabase');
  supabase = client;

  await Wized.requests.waitFor('get_user');
  const currentUser = r.get_user.data.user.id;
  // console.log('currentUser = ', currentUser);

  await Wized.requests.waitFor('get_chatbots');

  await Wized.requests.waitFor('get_members');
  const currentOrganization = r.get_user_data.data[0].organizations.find(o => o.id == v.activeOrganization);
  const currentMember = r.get_members.data.find(item => item.user_id == currentUser);
  // console.log('✅ currentOrganization = ', currentOrganization);
  // console.log('✅ currentMember = ', currentMember);

  let skeletonShown = false;

  async function hidekeleton() {
    // await Wized.requests.waitFor('get_chats');
    // console.log('hiding skeleton');
    document.querySelector("[w-el='skeleton-inbox-initial']").style.display = 'none';
    skeletonShown = true;
  }

  // Function to update inbox tab counts
  (window.updateInboxCounts = async function () {
    try {
      const { data, error } = await supabase.rpc('get_inbox_counts', {
        p_user_id: currentUser,
        p_organization_id: currentOrganization.id,
        p_team_inbox: currentOrganization.team_inbox_enabled
      });

      if (error) {
        console.error('Error getting inbox counts:', error);
        return;
      }

      const newCount = data.nieuw_count;
      const assignedCount = data.voorjou_count;
      // Update UI with counts
      const newTabCounter = document.querySelector('[inbox-tab-count="nieuw"]');
      const assignedTabCounter = document.querySelector('[inbox-tab-count="voorjou"]');
      // Only show counts if they are greater than 0
      if (newCount > 0) {
        newTabCounter.textContent = newCount;
        newTabCounter.style.display = 'flex';
      } else {
        newTabCounter.style.display = 'none';
      }
      if (assignedTabCounter) {
        if (assignedCount > 0) {
          assignedTabCounter.textContent = assignedCount;
          assignedTabCounter.style.display = 'flex';
        } else {
          assignedTabCounter.style.display = 'none';
        }
      }
      console.log('✅ Updated inbox counts: New:', newCount, 'Assigned:', assignedCount);
    } catch (error) {
      console.error('Error updating inbox counts:', error);
    }
    // console.log('updated inbox counts');
  })();

  // Call the count update function initially
  setInterval({ updateInboxCounts }, 30000);

  (function initFilters() {
    const filtersDefaultState = {
      livechat: {
        enabled: false,
        value: false
      },
      assigned: {
        enabled: false,
        value: false
      },
      read: {
        enabled: false,
        value: false
      },
      chatbots: {
        enabled: false,
        value: []
      },
      containstext: {
        enabled: false,
        value: ''
      }
    };

    window.updateFilterProperty = function (filterName, property, value) {
      // create completely new object with new nested objects
      v.inboxFilters = {
        ...JSON.parse(JSON.stringify(v.inboxFilters)),
        [filterName]: {
          ...JSON.parse(JSON.stringify(v.inboxFilters[filterName])),
          [property]: value
        }
      };
      // console.log(`Updated filter ${filterName}.${property} to:`, value);
    };

    function updateUrlParams() {
      const qp = {
        chat: v.active_chat,
        closed: i.toggle_inboxfilters_closed,
        new: i.toggle_inboxfilters_new,
        tab: v.active_inbox_tab
      };

      // Only add filters to URL if inboxFilters is not empty
      if (v.inboxFilters && Object.keys(v.inboxFilters).length > 0) {
        qp.filters = v.inboxFilters;
      }

      const url = new URL(window.location);
      Object.entries(qp).forEach(([k, v]) => {
        url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
      });
      window.history.replaceState(null, '', url.toString());
    }

    const filters = currentMember.inbox_filters;
    // console.log('✅ filters = ', filters);

    const getChatbots = r.get_chatbots.data.map(chatbot => chatbot.id);

    // Helper function to apply filters
    function applyFilters(filterObject) {
      // Filter out chatbots that are not in the availableChatbots array
      filterObject.chatbots.value = filterObject.chatbots.value.filter(chatbot => getChatbots.includes(chatbot));
      v.inboxFilters = filterObject;

      // make deep copy
      v.realTimeFilters = JSON.parse(JSON.stringify(filterObject));

      updateInboxCounts();

      i.inboxfilter_livechat_enabled = filterObject.livechat.value;
      i.inboxfilter_assigned_enabled = filterObject.assigned.value;
      i.inboxfilter_isread = filterObject.read.value;
      if (filterObject.containstext.value) i['inboxfilters-containstext'] = filterObject.containstext.value;

      window.updateFilterProperty('chatbots', 'value', filterObject.chatbots.value);
    }

    // Check if there are filters in the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters = urlParams.get('filters');
    let queryParamFilters = null;

    if (urlFilters) {
      try {
        queryParamFilters = JSON.parse(urlFilters);
        console.log('✅ filters from URL', queryParamFilters);
      } catch (e) {
        console.error('Error parsing filters from URL', e);
      }
    }

    if (queryParamFilters) {
      // Prioritize URL filters over database filters
      console.log('✅ using filters from URL');
      applyFilters(queryParamFilters);
    } else if (filters) {
      console.log('✅ using filters from DB');
      applyFilters(filters);
      // console.log('✅ v.inboxFilterChatbots = ', v.inboxFilters);
    } else {
      console.log('✅ setting new default filters');
      applyFilters(filtersDefaultState);

      console.log('❌ no filters ');
    }

    window.manuallyApplyFilters = async function () {
      v.usedFilters = true;

      // const dropdownModals = document.querySelectorAll('[w-el="filters-dropdown"]');
      // dropdownModals.forEach(function (modal) {
      //   modal.style.display = 'none';
      // });
      closeallmodals;

      // v.realTimeFilters = v.inboxFilters;
      // console.log('v.realTimeFilters = ', v.realTimeFilters);

      // changeFilterVariable();
      v.realTimeFilters = JSON.parse(JSON.stringify(v.inboxFilters));

      // add filters to queryparams in url
      // updateUrlParams();

      v.loadmorechats = [];
      v.newchats = [];
      v.updatedChats = [];

      Wized.requests.execute('get_chats');
    };

    window.saveFilters = async function () {
      // v.usedFilters = true;
      const { error } = await supabase.from('members').update({ inbox_filters: v.realTimeFilters }).eq('id', currentMember.id);
      if (!error) window.showToastNotification('Filters opgeslagen', 'success');
    };

    window.addFilter = function (filter) {
      v.inboxFilters[filter].enabled = true;
    };
    window.removeFilter = function (filter) {
      v.inboxFilters[filter].enabled = false;
    };
    window.resetFilters = function () {
      window.hideAllTooltips();
      v.usedFilters = true;
      applyFilters(filtersDefaultState);
      Wized.requests.execute('get_chats');
    };

    //
  })();

  // end initfilters

  if (localStorage.getItem('sleakTrialExpired') !== 'true') {
    Wized.requests.execute('get_chats');
  }

  // switch active chat
  window.switchActiveChat = async function (newChatId) {
    // ⚠️ speeds gonna be a problem here
    v.active_chat = newChatId;

    // v.active_chat_object = JSON.parse(JSON.stringify(v.chats.find(chat => chat.id == newChatId)));
    if (!newChatId) {
      v.active_chat_object = null;
      v.livechatstatus = false;
    } else {
      const newChat = await fetchChat(newChatId);
      // console.log('📥 fetchChat response =', newChat);

      v.active_chat_object = JSON.parse(JSON.stringify(newChat));
      v.livechatstatus = v.active_chat_object.livechat;

      Wized.requests.execute('update_chat_hasunread');
    }

    if (!skeletonShown) {
      setTimeout(() => {
        hidekeleton();
      }, 500);
    }

    // Update URL with chat ID
    const url = new URL(window.location);
    if (newChatId) {
      url.searchParams.set('chat', newChatId);
    } else {
      url.searchParams.delete('chat');
    }
    window.history.replaceState(null, '', url.toString());

    // if (v.active_chat_object.livechat == false) {
    //   document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
    // } else {
    //   document.querySelector('[w-el="admin-ui-chat-input"]').removeAttribute('readonly');
    // }

    if (window.innerWidth <= 768) {
      document.querySelector('[w-el="messages-grid-container"]').style.display = 'flex';
    }
  };

  (async function setActiveChat() {
    await Wized.requests.waitFor('get_chats');

    // Check if chat ID exists in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdFromUrl = urlParams.get('chat');

    if (v.chats.length > 0) {
      if (chatIdFromUrl && v.chats.some(chat => chat.id === chatIdFromUrl)) {
        // Use chat ID from URL if it exists in the chats list
        window.switchActiveChat(chatIdFromUrl);
      } else {
        // Fall back to first chat in the list
        window.switchActiveChat(v.chats[0].id);
      }

      // // if livechat is false, disable input
      // if (v.chats.find(chat => chat.id === v.active_chat).livechat == false) {
      //   document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
      // }
    } else {
      window.switchActiveChat(null);
    }
  })();

  window.changeSidebarTabs = async function () {
    Wized.requests.execute('get_chats');
    v.updatedChats = [];
    v.newchats = [];
    v.loadmorechats = [];
    await Wized.requests.waitFor('get_chats');

    if (v.chats.length > 0) {
      window.switchActiveChat(v.chats[0].id);
    } else {
      v.active_chat_object = null;
    }
    updateInboxCounts();
  };

  async function fetchChat(chat_id) {
    const { data } = await supabase
      .from('chats')
      .select('*, operators(*), messages!inner(*)') // join
      .eq('id', chat_id)
      .order('created_at', { foreignTable: 'messages', ascending: true })
      .single();
    return data;
  }

  // Send a system message to the chat with custom message_type_data
  async function sendSystemMessage(chat_id, message_type, message_type_data, author_member_id = null) {
    await supabase.from('messages').insert({
      visitor_id: chat_id,
      author_type: 'system',
      message_type: message_type,
      message_type_data: message_type_data,
      chatbot_id: v.active_chat_object.chatbot_id,
      author_member_id: author_member_id || currentMember.id
    });
  }

  // Compare operators and livechat status in real-time vs database state
  function matchObjects(realtimeState, dbState) {
    console.log('dbState', dbState);
    console.log('realtimeState', realtimeState);

    if (realtimeState.livechat !== dbState.livechat || realtimeState.agent_requested !== dbState.agent_requested || realtimeState.open !== dbState.open) {
      return false;
    }

    if (realtimeState.operators.length !== dbState.operators.length) {
      return false;
    }

    const sortedRealTime = [...realtimeState.operators].sort((a, b) => a.user_id.localeCompare(b.user_id));
    const sortedDbState = [...dbState.operators].sort((a, b) => a.user_id.localeCompare(b.user_id));

    const operatorsMatch = sortedRealTime.every((realTimeOp, index) => {
      const dbOp = sortedDbState[index];
      return realTimeOp.user_id === dbOp.user_id && realTimeOp.status === dbOp.status;
    });

    if (!operatorsMatch) {
      return false;
    }

    console.log('states match');
    return true;
  }

  async function removeActiveOperators(chat_id, except_user_id = null, assigned_manually = false) {
    // Remove all active operators except the one being invited

    const { data: operators } = await supabase.from('operators').select('*').eq('chat_id', chat_id).in('status', ['active', 'invited']);

    if (operators && operators.length > 0) {
      for (const op of operators) {
        if (op.user_id !== except_user_id) {
          await supabase.from('operators').update({ status: 'left' }).eq('chat_id', chat_id).eq('user_id', op.user_id);
          // Only send system message for active operators
          if (op.status === 'active' && !assigned_manually) {
            // await sendSystemMessage(chat_id, 'operator_changed', { event_type: 'left', type: 'assign_manually' }, op.member_id);
          }
          console.log(`Operator removed from chat : `, op);
        }
      }
    }
  }

  (async function liveChatPresence() {
    async function joinChat(user_id, chatState) {
      // For dynamic syustem message
      const messageData = { event_type: 'joined' };
      const otherActiveOperators = chatState.operators.filter(op => op.status === 'active' && op.user_id !== user_id);
      if (otherActiveOperators.length > 0) {
        messageData.event_context = 'manually_takeover';
        messageData.from = otherActiveOperators[0].user_id;
      }

      const updates = {};
      updates.assigned_manually = false;
      if (chatState.open == false) {
        updates.open = true;
      }
      if (chatState.agent_requested == true) {
        updates.agent_requested = false;
      }
      if (chatState.livechat == false) {
        updates.livechat = true;
      }
      // update chat if required
      if (Object.keys(updates).length > 0) {
        await supabase.from('chats').update(updates).eq('id', chatState.id);
      }

      // const remainingOperators = chatState.operators.filter(op => op.status === 'active' && op.user_id !== user_id);
      // if (remainingOperators.length === 0) {
      //   // updates.livechat = true;
      //   // updates.agent_requested = false;
      // } else {
      //   // remove any existing operators
      //   await supabase.from('operators').update({ status: 'left' }).eq('chat_id', chatState.id);
      //   await sendSystemMessage(chatState.id, 'operator_changed', { event_type: 'left', type: 'assign_manually' });
      // }
      removeActiveOperators(chatState.id, user_id);

      if (chatState.operators.some(op => op.user_id === user_id)) {
        // Update status if operator already exists
        await supabase.from('operators').update({ status: 'active' }).eq('chat_id', chatState.id).eq('member_id', currentMember.id);
      } else {
        // insert new operator if not already in the chat
        await supabase.from('operators').insert([{ chat_id: chatState.id, member_id: currentMember.id, user_id: user_id, status: 'active' }]);
      }

      if (chatState.open == false) {
        await sendSystemMessage(chatState.id, 'chat_opened', {});
      }

      await sendSystemMessage(chatState.id, 'operator_changed', messageData);

      v.livechatstatus == true;
      // document.querySelector('[w-el="admin-ui-chat-input"]').removeAttribute('readonly');
      // let joinLivechatEvent = new CustomEvent('joinLivechat', { detail: { message: 'Joining live chat' } });
      // window.dispatchEvent(joinLivechatEvent);
    }

    async function leaveChat(user_id, chatState) {
      const updates = {};
      if (chatState.livechat == true) {
        updates.livechat = false;
      }
      if (chatState.open == true) {
        updates.open = false;
      }
      // Update chat with all changes
      await supabase.from('chats').update(updates).eq('id', chatState.id);

      // const remainingOperators = chatState.operators.filter(op => op.status === 'active' && op.user_id !== user_id);
      // // if (remainingOperators.length === 0) {
      // //   updates.livechat = false;
      // // }

      await supabase.from('operators').update({ status: 'left' }).eq('chat_id', chatState.id).eq('member_id', currentMember.id);
      await sendSystemMessage(chatState.id, 'operator_changed', { event_type: 'left' });

      if (chatState.open == true) {
        await sendSystemMessage(chatState.id, 'chat_closed', {});
      }

      // document.querySelector('[w-el="admin-ui-chat-input"]').setAttribute('readonly', true);
      // let leaveLivechatEvent = new CustomEvent('leaveLivechat', { detail: { message: 'Joining live chat' } });
      // window.dispatchEvent(leaveLivechatEvent);
    }

    window.handleLiveChat = async function (realtimeState) {
      const chat_id = realtimeState.id;
      const user_id = currentUser;

      const chatState = await fetchChat(chat_id);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        window.showToastNotification('States do not match', 'warning');
        return;
      }

      const agentIsInChat = chatState.operators.some(op => op.user_id === user_id && op.status === 'active');
      console.log('agent is in chat = ', agentIsInChat);

      if (agentIsInChat) {
        console.log('leave chat');
        await leaveChat(user_id, chatState);
      } else {
        console.log('join chat');
        await joinChat(user_id, chatState);
      }
    };
  })();

  //

  (async function defineLivechatAssignment() {
    // Invite or update operator
    async function inviteOperator(chat_id, user_id, member_id) {
      // Check if operator already exists
      const { data: existing } = await supabase.from('operators').select('*').eq('chat_id', chat_id).eq('user_id', user_id).maybeSingle();

      if (existing) {
        // Update status to invited
        await supabase.from('operators').update({ status: 'invited' }).eq('chat_id', chat_id).eq('user_id', user_id);
        console.log(`Operator ${user_id} status updated to invited for chat ${chat_id}`);
      } else {
        console.log('operator doesnt exist, inserting new operator');
        // Insert new operator
        await supabase.from('operators').insert([{ chat_id, member_id, user_id, status: 'invited' }]);
        console.log(`Operator ${user_id} invited to chat ${chat_id}`);
      }
    }

    window.assignLivechat = async function (realtimeState, user_id, member_id) {
      const chat_id = realtimeState.id;
      const chatState = await fetchChat(chat_id);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        window.showToastNotification('States do not match', 'warning');
        return;
      }

      window.closeAllPopupModals();

      const updates = {};
      updates.assigned_manually = true;
      if (chatState.livechat) {
        updates.livechat = false;
      }
      if (chatState.agent_requested == false) {
        updates.agent_requested = true;
      }
      if (chatState.open == false) {
        updates.open = true;
      }
      // Update chat if required
      if (Object.keys(updates).length > 0) {
        await supabase.from('chats').update(updates).eq('id', chat_id);
      }

      // if chat is closed, open it
      if (chatState.open == false) {
        await sendSystemMessage(chatState.id, 'chat_opened', {});
      }

      // Remove all active operators except the one being invited
      await removeActiveOperators(chat_id, user_id, true);

      // Invite or update the operator
      await inviteOperator(chat_id, user_id, member_id);

      await sendSystemMessage(chat_id, 'agent_requested', { type: 'assign_manually', assigned_to: user_id, assigned_by: currentUser });
    };
  })();

  //

  function chatListRemoveChat(chatState) {
    const chatListItem = document.querySelector(`#${CSS.escape(chatState.id)}`);
    if (!chatListItem) return;

    chatListItem.style.transformOrigin = 'top';

    gsap.to(chatListItem, {
      scale: 0,
      duration: 0.2,
      ease: 'power4.inOut',
      onComplete: () => {
        gsap.to(chatListItem, { height: 0, duration: 0.1, ease: 'power4.inOut' });
        setTimeout(() => {
          chatListItem.style.display = 'none';
        }, 100);
      }
    });
  }

  function chatListAddChat(chatState) {
    const chatListItem = document.querySelector(`#${CSS.escape(chatState.id)}`);
    if (!chatListItem) return;

    chatListItem.style.display = ''; // Reset display property
    chatListItem.style.transformOrigin = 'top';
    chatListItem.style.height = '0px';
    chatListItem.style.transform = 'scale(0)';

    setTimeout(() => {
      gsap.to(chatListItem, {
        height: 'auto',
        scale: 1,
        duration: 0.2,
        ease: 'power4.inOut'
      });
    }, 10);
  }

  (async function chatClosing() {
    // what if there are operators? Or livechat = true?

    window.closeChat = async function (realtimeState) {
      const chat_id = realtimeState.id;

      const chatState = await fetchChat(chat_id);

      if (!matchObjects(realtimeState, chatState)) {
        console.log('states do not match');
        window.showToastNotification('States do not match', 'warning');
        return;
      }

      // ⚠️ remove this?
      // const objectInChatsList = v.allchats.some(chat => chat.id == chatState.id);

      // ⚠️ this needs to be reconsidered for the new "nieuw/alles" toggle
      if (v.active_inbox_tab == 'nieuw') {
        console.log('NIEUW');
        if (chatState.open == true) {
          chatListRemoveChat(chatState);
        } else {
          chatListAddChat(chatState);
        }
      } else if (v.active_inbox_tab !== 'nieuw') {
        // ⚠️ compare with chat state instead of input state
        if (i.toggle_inboxfilters_closed == true) {
          console.log('closed is true');
          if (chatState.open == true) {
            chatListAddChat(chatState);
          } else {
            chatListRemoveChat(chatState);
          }
        } else {
          console.log('closed is false');
          if (chatState.open == true) {
            chatListRemoveChat(chatState);
          } else {
            chatListAddChat(chatState);
          }
        }
      }

      if (chatState.open == true) {
        // close chat
        await supabase.from('chats').update({ open: false }).eq('id', chatState.id);
        await sendSystemMessage(chat_id, 'chat_closed', {});
      } else if (chatState.open == false) {
        // open chat
        await supabase.from('chats').update({ open: true }).eq('id', chatState.id);
        await sendSystemMessage(chat_id, 'chat_opened', {});
      }
    };
  })();
  //
  // });
})();
