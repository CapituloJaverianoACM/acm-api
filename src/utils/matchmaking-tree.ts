export const shuffle_array = (array: Array<unknown>) => {
  let currentIndex = array.length;

  while (currentIndex != 0) {

    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

export type MatchmakingTreeNode = {
    student_id: null | number;
    left: null | MatchmakingTreeNode;
    right: null | MatchmakingTreeNode;
};

// [l, r) for index range
export function makeMatches(
    participants: Array<number>, // by ref, no copy
    l: number,
    r: number,
): MatchmakingTreeNode | null {
    const node: MatchmakingTreeNode = {
        student_id: null,
        left: null,
        right: null,
    };


    if (l == r) return null;
    if (l + 1 == r) node.student_id = participants[l];
    else {
        const mid: number = l + Math.trunc((r - l) / 2);
        node.left = makeMatches(participants, l, mid);
        node.right = makeMatches(participants, mid, r);
    }

    return node;
}
