# CS240 — synthetic lecture digest

## Lecture 1 — Big-O (p. 1–18)
Upper bound on growth rate. O(1) constant, O(log n) binary-search style,
O(n) linear scan, O(n log n) sorting, O(n²) nested loop, O(2ⁿ) exponential.
T(n) = T(n/2) + O(1) → O(log n). T(n) = 2T(n/2) + O(n) → O(n log n)
(Master Theorem case 2).

## Lecture 2 — Sorting (p. 19–40)
Quicksort: average O(n log n), worst O(n²) if bad pivot. In-place.
Mergesort: always O(n log n), requires O(n) extra memory, stable.
Heapsort: always O(n log n), in-place, not stable. Radix sort O(nk)
works only on bounded-range integers.

## Lecture 3 — Hash tables (p. 41–58)
Expected O(1) insert/lookup with uniform hashing. Load factor α = n/m.
Collisions: chaining (linked list per bucket, α can exceed 1) vs open
addressing (linear/quadratic/double probing, α < 1 required). Rehash
when α > 0.75 to maintain O(1).

## Lecture 4 — Graph traversal (p. 59–80)
BFS: queue, O(V+E), shortest unweighted path. DFS: stack/recursion,
O(V+E), cycle detection + topological sort. Dijkstra: priority queue,
O((V+E) log V) with binary heap, positive weights only. BFS with
weighted edges gives wrong answers — this is a common bug.
