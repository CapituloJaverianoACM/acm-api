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

    public rebuildTree(nodeData: any): ContestTreeNode | undefined {
        if (!nodeData) return undefined;
        this.left = this.rebuildTree(nodeData.left);
        this.right = this.rebuildTree(nodeData.right);

        if (this.left) this.left.parent = this;
        if (this.right) this.right.parent = this;

        return this;
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

    findNode(id_participant: number): ContestTreeNode | null {
        if (this.id_participant === id_participant) return this;
        let foundNode: ContestTreeNode | null = null;
        if (this.left) foundNode = this.left.findNode(id_participant);
        if (foundNode) return foundNode;
        if (this.right) foundNode = this.right.findNode(id_participant);
        return foundNode;
    }

    public set_winner(id_participant: number): void {
        // Find the node with the given participant ID
        const node = this.findNode(id_participant);
        if (!node || !node.parent) return; // Node not found or is root

        // Set the parent's participant ID to the winner's ID
        node.parent.id_participant = id_participant;
    }
}
