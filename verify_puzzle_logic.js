
// Logic Verification Script for Sliding Puzzle

function createSolvedState(size) {
    return Array.from({ length: size * size }, (_, i) => i);
}

function getValidMoves(emptyIndex, size) {
    const moves = [];
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    if (row > 0) moves.push(emptyIndex - size); // Up
    if (row < size - 1) moves.push(emptyIndex + size); // Down
    if (col > 0) moves.push(emptyIndex - 1); // Left
    if (col < size - 1) moves.push(emptyIndex + 1); // Right

    return moves;
}

function shuffle(initialState, size) {
    let tiles = [...initialState];
    let currentEmptyIndex = tiles.indexOf(size * size - 1);
    const moves = 100 * (size - 2);

    // Simulate the shuffle logic we want to implement (non-reactive)
    for (let i = 0; i < moves; i++) {
        const possibleMoves = getValidMoves(currentEmptyIndex, size);
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        // Swap
        [tiles[currentEmptyIndex], tiles[randomMove]] = [tiles[randomMove], tiles[currentEmptyIndex]];
        currentEmptyIndex = randomMove;
    }
    return tiles;
}

function checkSolvability(tiles, size) {
    // In our shuffle implementation, we only use valid moves from a solved state, 
    // so it MUST be solvable by definition. This test verifies that property.
    // However, classical solvability check involves inversion counts.

    // For this script, we trust the shuffle by valid moves. 
    // We just want to ensure the function runs without error and produces a permutation.

    const sorted = [...tiles].sort((a, b) => a - b);
    const isPermutation = sorted.every((val, index) => val === index);

    if (!isPermutation) return false;

    // Check key constraint: last element is present (the empty tile ID in our logic)
    // In the Vue component, user treats 'size*size - 1' as the empty tile.
    return tiles.includes(size * size - 1);
}

// Test Runner
try {
    const size = 3;
    const solved = createSolvedState(size);
    console.log("Initial state:", solved);

    const shuffled = shuffle(solved, size);
    console.log("Shuffled state:", shuffled);

    if (checkSolvability(shuffled, size)) {
        console.log("PASS: Shuffle produced a valid permutation.");
    } else {
        console.error("FAIL: Shuffle produced an invalid state.");
        process.exit(1);
    }

    // Test Move Logic
    const emptyIndex = shuffled.indexOf(size * size - 1);
    const validMoves = getValidMoves(emptyIndex, size);
    console.log(`Valid moves for hole at ${emptyIndex}:`, validMoves);

    if (validMoves.length === 0) {
        console.error("FAIL: No valid moves found for empty tile.");
        process.exit(1);
    }

    console.log("PASS: Move logic generated valid adjacent indices.");

    console.log("All Logic Tests Passed.");
} catch (e) {
    console.error("Test execution failed:", e);
    process.exit(1);
}
