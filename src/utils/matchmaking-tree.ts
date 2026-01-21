export const shuffle_array = (array: Array<unknown>) => {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
};

export type MatchmakingTreeNode = {
    student_id: null | number;
    left: null | MatchmakingTreeNode;
    right: null | MatchmakingTreeNode;
};

const midpoint = (l: number, r: number) => l + Math.trunc((r - l) / 2);

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
        const mid: number = midpoint(l, r);
        node.left = makeMatches(participants, l, mid);
        node.right = makeMatches(participants, mid, r);
    }

    return node;
}

export function getOpponentInTree(
    root: MatchmakingTreeNode,
    student_id: number,
): number | null {
    if (root.student_id) return null;

    if (!root.left?.student_id || !root.right?.student_id) {
        let res = null;
        if (root.left) {
            res = getOpponentInTree(root.left, student_id);
            if (res) return res;
        }
        if (root.right) res = getOpponentInTree(root.right, student_id);

        return res;
    } else {
        if (root.right.student_id === student_id) return root.left.student_id;
        if (root.left.student_id === student_id) return root.right.student_id;

        return null;
    }
}
