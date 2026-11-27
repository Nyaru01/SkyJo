export const AVATARS = [
    { id: 'cat', name: 'Chat', emoji: '🐱', path: '/avatars/cat.webp?v=3' },
    { id: 'dog', name: 'Chien', emoji: '🐶', path: '/avatars/dog.webp?v=3' },
    { id: 'fox', name: 'Renard', emoji: '🦊', path: '/avatars/fox.webp?v=3' },
    { id: 'bear', name: 'Ours', emoji: '🐻', path: '/avatars/bear.webp?v=3' },
    { id: 'panda', name: 'Panda', emoji: '🐼', path: '/avatars/panda.webp?v=3' },
    { id: 'lion', name: 'Lion', emoji: '🦁', path: '/avatars/lion.webp?v=3' },
    { id: 'frog', name: 'Grenouille', emoji: '🐸', path: '/avatars/frog.webp?v=3' },
    { id: 'monkey', name: 'Singe', emoji: '🐵', path: '/avatars/monkey.webp?v=3' },
    { id: 'owl', name: 'Hibou', emoji: '🦉', path: '/avatars/owl.webp?v=3' },
    { id: 'rabbit', name: 'Lapin', emoji: '🐰', path: '/avatars/rabbit.webp?v=3' },
    { id: 'raccoon', name: 'Raton laveur', emoji: '🦝', path: '/avatars/raccoon.webp?v=3' },
    { id: 'hedgehog', name: 'Hérisson', emoji: '🦔', path: '/avatars/hedgehog.webp?v=3' },
];

const DEFAULT_AVATAR_PATH = AVATARS[0].path;

export const getAvatarPath = (id) => AVATARS.find(avatar => avatar.id === id)?.path ?? DEFAULT_AVATAR_PATH;

export function handleAvatarError({ currentTarget }) {
    if (currentTarget.getAttribute('src') !== DEFAULT_AVATAR_PATH) {
        currentTarget.src = DEFAULT_AVATAR_PATH;
    }
}
