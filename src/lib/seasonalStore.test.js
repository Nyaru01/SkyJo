import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

test('real stores: admin preview isolation, restore, seasonal reward idempotence', async () => {
    const files = new Map();
    globalThis.localStorage = {getItem:k=>files.get(k)??null,setItem:(k,v)=>files.set(k,v),removeItem:k=>files.delete(k)};
    const dir = await mkdtemp(join(tmpdir(), 'skyjo-seasonal-test-'));
    try {
        const output = await build({stdin:{contents:`export {useGameStore} from './src/store/gameStore.js'; export {useVirtualGameStore} from './src/store/virtualGameStore.js';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,
            plugins:[{name:'silent-toasts',setup(b){b.onResolve({filter:/^react-hot-toast$/},()=>({path:'toast',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export default {success(){},error(){}}'}));}}]});
        const file = join(dir, 'stores.mjs');await writeFile(file,output.outputFiles[0].text);
        const {useGameStore:g,useVirtualGameStore:v} = await import(pathToFileURL(file));
        g.setState({isAdminOpen:false,adminAuthToken:null});
        assert.equal(v.getState().startSeasonalPreview(),false);
        v.getState().startAIGame({name:'Test'},1,'bonus',{isBonusMode:true});
        const previous = JSON.stringify(v.getState().gameState);
        const persisted = JSON.parse(files.get('skyjo-virtual-storage')).state;
        g.setState({isAdminOpen:true,adminAuthToken:'test-token'});
        const account = () => JSON.stringify({xp:g.getState().currentXP,level:g.getState().level,history:g.getState().gameHistory,wins:g.getState().seasonalChallengeWins,daily:g.getState().lastDailyWinDate,weekly:g.getState().weeklyChallengeWinDate});
        const before = account();
        assert.equal(v.getState().startSeasonalPreview(),true);
        assert.equal(v.getState().gameState.seasonalChallengeId,'recolte_2026');
        const finishWinningHarvest = () => {
            const state=structuredClone(v.getState().gameState);
            state.players[0].columnsCleared=2;
            state.players[0].hand=Array.from({length:12},(_,i)=>i<6?null:{id:'h'+i,value:-2,isRevealed:true});
            state.players[1].hand=Array.from({length:12},(_,i)=>({id:'a'+i,value:12,isRevealed:true}));
            state.finishingPlayerIndex=0;
            v.setState({gameState:state});v.getState().debugForceEndRound();
        };
        finishWinningHarvest();
        assert.deepEqual(v.getState().gameState.seasonalResult,{success:true,rewardXP:15,preview:true});
        g.getState().addXP(50);g.getState().markDailyWin();
        assert.equal(g.getState().awardWeeklyChallenge('recolte_2026',15),false);
        g.getState().archiveVirtualGame({players:[{id:'human-1'}],totalScores:{},winner:null,roundsPlayed:1});
        v.getState().endRound();
        assert.equal(account(),before);
        assert.deepEqual(JSON.parse(files.get('skyjo-virtual-storage')).state,persisted);
        v.getState().exitSeasonalPreview();
        assert.equal(JSON.stringify(v.getState().gameState),previous);
        assert.equal(account(),before);
        assert.equal(g.getState().isAdminOpen,true);
        // A real seasonal finish grants once, even on repeated finalization and reload.
        v.getState().startAIGame({name:'Test'},1,'bonus',{isBonusMode:true,isWeeklyChallenge:true});
        v.setState({gameState:{...v.getState().gameState,seasonalChallengeId:'recolte_2026'}});
        finishWinningHarvest();
        const rewarded=account();
        assert.notEqual(rewarded,before);
        assert.equal(v.getState().gameState.seasonalResult.rewardXP,15);
        v.getState().debugForceEndRound();
        v.getState().endRound();v.getState().endRound();
        assert.equal(account(),rewarded);
        await v.persist.rehydrate();
        v.getState().debugForceEndRound();
        assert.equal(account(),rewarded);
        assert.equal(g.getState().awardWeeklyChallenge('recolte_2026',15),false);
    } finally { await rm(dir,{recursive:true,force:true}); delete globalThis.localStorage; }
});
