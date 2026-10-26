{{ define "bracketLayout" }}

function buildWinnerGraph(winners, connections) {
    const setIds = new Set(
        winners.flatMap(round =>
            round.Sets.map(set => set.Id)
        )
    );

    console.log(
        "Winner set IDs:",
        [...setIds]
    );

    console.log(
        "Connections count:",
        connections.length
    );

    const incoming = new Map();
    const outgoing = new Map();

    for (const round of winners) {
        for (const set of round.Sets) {
            incoming.set(set.Id, []);
            outgoing.set(set.Id, []);
        }
    }

    for (const connection of connections) {

        console.log(
            "Checking connection:",
            connection,
            "fromIsWinner:",
            setIds.has(connection.fromSetID),
            "toIsWinner:",
            setIds.has(connection.toSetID),
            "condition:",
            connection.condition
        );

        if (connection.condition !== "winner") {
            console.log("  -> skipped: condition");
            continue;
        }

        if (!setIds.has(connection.fromSetID)) {
            console.log(
                "  -> skipped: fromSet is not Winners"
            );
            continue;
        }

        if (!setIds.has(connection.toSetID)) {
            console.log(
                "  -> skipped: toSet is not Winners"
            );
            continue;
        }

        incoming
            .get(connection.toSetID)
            .push(connection);

        outgoing
            .get(connection.fromSetID)
            .push(connection);

        console.log("  -> ADDED");
    }

    return {
        incoming,
        outgoing,
    };
}

function findWinnerRoot(winners, outgoing) {
    for (const round of winners) {
        for (const set of round.Sets) {
            if (outgoing.get(set.Id)?.length === 0) {
                return set;
            }
        }
    }

    return null;
}

function calculateWinnerPositions(winners, incoming) {
    const positions = new Map();

    if (!winners.length) {
        return positions;
    }

    /*
     * Initial positions.
     */
    const firstRound = winners[0];

    firstRound.Sets.forEach((set, index) => {
        positions.set(set.Id, index * 2);
    });

    /*
     * Calculate position of every subsequent match
     * from its source matches.
     */
    for (let roundIndex = 1; roundIndex < winners.length; roundIndex++) {
        const round = winners[roundIndex];

        for (const set of round.Sets) {
            const sources = incoming.get(set.Id) ?? [];

            const sourcePositions = sources
                .map(connection =>
                    positions.get(connection.fromSetID)
                )
                .filter(position =>
                    position !== undefined
                );

            if (sourcePositions.length === 0) {
                continue;
            }

            const position =
                sourcePositions.reduce(
                    (sum, value) => sum + value,
                    0
                ) / sourcePositions.length;

            positions.set(set.Id, position);
        }
    }

    return positions;
}

function sortWinnerRounds(winners, positions) {
    return winners.map(round => ({
        ...round,

        Sets: [...round.Sets].sort(
            (a, b) =>
                (positions.get(a.Id) ?? Infinity) -
                (positions.get(b.Id) ?? Infinity)
        ),
    }));
}


{{ end }}