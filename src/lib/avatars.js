export const AVATARS = [
    { id: 'cat', name: 'Chat', emoji: '🐱', path: '/avatars/cat.png' },
    { id: 'dog', name: 'Chien', emoji: '🐶', path: '/avatars/dog.png' },
    { id: 'fox', name: 'Renard', emoji: '🦊', path: '/avatars/fox.png' },
    { id: 'bear', name: 'Ours', emoji: '🐻', path: '/avatars/bear.png' },
    { id: 'panda', name: 'Panda', emoji: '🐼', path: '/avatars/panda.png' },
    { id: 'lion', name: 'Lion', emoji: '🦁', path: '/avatars/lion.png' },
    { id: 'frog', name: 'Grenouille', emoji: '🐸', path: '/avatars/frog.png' },
    { id: 'monkey', name: 'Singe', emoji: '🐵', path: '/avatars/monkey.png' },
];

export const getAvatarPath = (id) => {
    const avatar = AVATARS.find(a => a.id === id);
    return avatar ? avatar.path : null;
};
