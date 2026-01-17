import { getTreeByContestId } from "../utils/contest-tree-manager";

async function test() {
    const contestId = 1;

    const tree1 = await getTreeByContestId(contestId);
    console.log("Primera llamada:", tree1);

    const tree2 = await getTreeByContestId(contestId);
    console.log("Segunda llamada (cache):", tree2);
}

test();
