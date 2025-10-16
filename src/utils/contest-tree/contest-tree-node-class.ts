// contest-tree-node-class.ts
import type { Static } from "elysia";
import { ContestTreeNodeSchema } from "./contest-tree-node-schema";

export type ContestTreeNodeType = Static<typeof ContestTreeNodeSchema>;

export class ContestTreeNode implements ContestTreeNodeType {
    id_participant?: number;
    parent?: ContestTreeNode;
    left?: ContestTreeNode;
    right?: ContestTreeNode;

    constructor(id_participant?: number) {
        this.id_participant = id_participant;
    }

    public createTree(ids_participants: number[]): void {
        // Create a complete binary tree and assign participant IDs to the leaves
        const depth = Math.ceil(Math.log2(ids_participants.length + 1)) - 1;
        this.createTreeRecursive(depth);
        // Assign participant IDs to the leaves in left-to-right order
        const leaves: ContestTreeNode[] = [];
        this.collectLeaves(this, leaves);
        for (let i = 0; i < ids_participants.length; i++) {
            if (i < leaves.length) {
                leaves[i].id_participant = ids_participants[i];
            }
        }
    }

    collectLeaves(node: ContestTreeNode | undefined, leaves: ContestTreeNode[]): void {
        if (!node) return;
        if (!node.left && !node.right) {
            leaves.push(node);
        } else {
            this.collectLeaves(node.left, leaves);
            this.collectLeaves(node.right, leaves);
        }
    }


    createTreeRecursive(depth: number): void {
        if (depth <= 0) return;
        this.left = new ContestTreeNode();
        this.right = new ContestTreeNode();
        this.left.parent = this;
        this.right.parent = this;
        this.left.createTreeRecursive(depth - 1);
        this.right.createTreeRecursive(depth - 1);
    }

    printTree(prefix: string = "", isLeft: boolean = true): void {
        console.log(prefix + (isLeft ? "├── " : "└── ") + (this.id_participant !== undefined ? this.id_participant : "null"));
        if (this.left) this.left.printTree(prefix + (isLeft ? "│   " : "    "), true);
        if (this.right) this.right.printTree(prefix + (isLeft ? "│   " : "    "), false);
    }

}
