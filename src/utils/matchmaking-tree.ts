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

function getChildIds(node: MatchmakingTreeNode): [number | null, number | null] {
    return [node.left?.student_id ?? null, node.right?.student_id ?? null];
}

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

/**
 * Intenta registrar el ganador de un match en el primer nodo "disponible"
 * cuya pareja de hijos sea exactamente [local_id, visitant_id] (en cualquier orden).
 *
 * Reglas (según pseudocódigo):
 * - Si el nodo ya tiene student_id (ya está resuelto), no se puede escribir.
 * - Si los hijos coinciden con [local, visitant], setear ganador y terminar.
 * - Si alguno de [local, visitant] aparece en los hijos pero no ambos, invalidar.
 * - Si los dos hijos ya están completos (sin nulls) pero no coinciden, invalidar.
 * - En caso contrario, seguir buscando recursivamente.
 */
export function createResultInTree(
    root: MatchmakingTreeNode | null,
    local_id: number,
    visitant_id: number,
    winner_id: number,
): boolean {
    if (!root) return false;

    if (root.student_id !== null) return false;

    const [leftId, rightId] = getChildIds(root);
    const childVals: [number | null, number | null] = [leftId, rightId];

    const matchesPair =
        (childVals[0] === local_id && childVals[1] === visitant_id) ||
        (childVals[0] === visitant_id && childVals[1] === local_id);

    if (matchesPair) {
        root.student_id = winner_id;
        return true;
    }

    const eitherInChildVals =
        childVals[0] === local_id ||
        childVals[1] === local_id ||
        childVals[0] === visitant_id ||
        childVals[1] === visitant_id;

    const childValsHaveNoNulls = childVals[0] !== null && childVals[1] !== null;

    if (eitherInChildVals || childValsHaveNoNulls) return false;

    return (
        createResultInTree(root.left, local_id, visitant_id, winner_id) ||
        createResultInTree(root.right, local_id, visitant_id, winner_id)
    );
}
