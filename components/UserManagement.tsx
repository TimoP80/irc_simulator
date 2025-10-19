import React, { useState } from 'react';
import { AddUserModal } from './AddUserModal';

interface User {
  nickname: string;
  personality: string;
}

interface UserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUsersChange }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddUser = (nickname: string, personality: string) => {
    const newUser: User = { nickname, personality };
    onUsersChange([...users, newUser]);
  };

  const handleUpdateUser = (oldNickname: string, newNickname: string, personality: string) => {
    const updatedUsers = users.map(user => 
      user.nickname === oldNickname 
        ? { nickname: newNickname, personality }
        : user
    );
    onUsersChange(updatedUsers);
    setEditingUser(null);
  };

  const handleDeleteUser = (nickname: string) => {
    if (window.confirm(`Are you sure you want to delete the user "${nickname}"?`)) {
      onUsersChange(users.filter(user => user.nickname !== nickname));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Virtual Users</h3>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">No users yet</p>
          <p className="text-sm">Add your first virtual user to get started</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.map((user, index) => (
            <div
              key={`${user.nickname}-${index}`}
              className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white text-lg">{user.nickname}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                      AI User
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{user.personality}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.nickname)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Delete user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        existingNicknames={users.map(u => u.nickname)}
        editingUser={editingUser}
      />
    </div>
  );
};
