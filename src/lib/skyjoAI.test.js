import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_DIFFICULTY, decideCardAction } from './skyjoAI.js';

const card = (value, isRevealed = true, extra = {}) => ({
    value,
    isRevealed,
    lockCount: 0,
    ...extra,
});

const buildTourmentState = (aiHand, drawnValue) => ({
    players: [
        { id: 'ai-1', name: 'IA', hand: aiHand },
        {
            id: 'human-1',
            name: 'Vous',
            hand: [
                card(5, false), card(5, false), card(5),
                card(-1), card(0), card(-10),
                card(-1), card(3), card(3),
                card(-1), card(0), card(0),
            ],
        },
    ],
    currentPlayerIndex: 0,
    drawnCard: card(drawnValue),
    turnPhase: 'REPLACE_OR_DISCARD',
    isBonusMode: true,
    discardPile: [],
    drawPile: [],
    phase: 'PLAYING',
});

test('Tourment termine les deux 4 avant de préparer une colonne avec un Joker', () => {
    // Reproduction de la capture : la colonne 3 contient 4, 4, cachée.
    // La carte visible 9 en haut à droite peut seulement préparer 4, cachée, Joker.
    const aiHand = [
        card(1), card(1), card(5, false),
        card(0), card(0), card(6, false),
        card(4), card(4), card(7, false),
        card(9), card(8, false), card(0, true, { specialType: 'C' }),
    ];

    const decision = decideCardAction(
        buildTourmentState(aiHand, 4),
        AI_DIFFICULTY.BONUS,
    );

    assert.deepEqual(decision, { action: 'REPLACE', cardIndex: 8 });
});

test('Tourment conserve une colonne très négative au lieu de la supprimer', () => {
    const aiHand = [
        card(1), card(1), card(5, false),
        card(0), card(0), card(6, false),
        card(-10), card(-10), card(7, false),
        card(9), card(8, false), card(0, true, { specialType: 'C' }),
    ];

    const decision = decideCardAction(
        buildTourmentState(aiHand, -10),
        AI_DIFFICULTY.BONUS,
    );

    assert.notEqual(decision.cardIndex, 8);
});
