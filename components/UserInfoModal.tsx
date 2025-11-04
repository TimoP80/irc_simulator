import React from 'react';
import { useChatState, useChatDispatch } from '../context/ChatProvider';
import { Modal } from '@/components/Modal'; // Using absolute path alias

export const UserInfoModal = () => {
  const { isUserInfoModalOpen, userInfo } = useChatState();
  const dispatch = useChatDispatch();

  const handleClose = () => {
    dispatch({ type: 'TOGGLE_USER_INFO_MODAL', payload: false });
  };

  if (!isUserInfoModalOpen || !userInfo) {
    return null;
  }

  return (
    <Modal isOpen={isUserInfoModalOpen} onClose={handleClose} title={`User Info: ${userInfo.nick}`}>
      <div className="p-4">
        <p><strong>Nickname:</strong> {userInfo.nick}</p>
        <p><strong>Username:</strong> {userInfo.user}</p>
        <p><strong>Hostname:</strong> {userInfo.host}</p>
        <p><strong>Real Name:</strong> {userInfo.realname}</p>
        <p><strong>Channels:</strong> {userInfo.channels.join(', ')}</p>
        <p><strong>Server:</strong> {userInfo.server} ({userInfo.serverinfo})</p>
      </div>
    </Modal>
  );
};