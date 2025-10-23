(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TOKEN-ID u101)
(define-constant ERR-INVALID-METADATA u102)
(define-constant ERR-INVALID-HASH u103)
(define-constant ERR-TOKEN-ALREADY-EXISTS u104)
(define-constant ERR-TOKEN-NOT-FOUND u105)
(define-constant ERR-TRANSFER-NOT-ALLOWED u106)
(define-constant ERR-BURN-NOT-ALLOWED u107)
(define-constant ERR-INVALID-OWNER u108)
(define-constant ERR-INVALID-RECIPIENT u109)
(define-constant ERR-MINT-PAUSED u110)
(define-constant ERR-INVALID-TITLE u111)
(define-constant ERR-INVALID-DESCRIPTION u112)
(define-constant ERR-INVALID-MEDIA-LINK u113)
(define-constant ERR-MAX-MINT-EXCEEDED u114)
(define-constant ERR-INVALID-TIMESTAMP u115)
(define-constant ERR-PROVENANCE-NOT-SET u116)
(define-constant ERR-INVALID-PROVENANCE-ID u117)
(define-constant ERR-UPDATE-NOT-ALLOWED u118)
(define-constant ERR-INVALID-UPDATE-PARAM u119)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u120)

(define-data-var next-token-id uint u0)
(define-data-var max-mint-per-user uint u10)
(define-data-var mint-paused bool false)
(define-data-var contract-owner principal tx-sender)
(define-data-var provenance-tracker (optional principal) none)

(define-map tokens
  uint
  {
    owner: principal,
    content-hash: (buff 32),
    title: (string-utf8 100),
    description: (string-utf8 500),
    media-link: (optional (string-utf8 200)),
    timestamp: uint,
    provenance-id: (optional uint)
  }
)

(define-map token-owners
  uint
  principal)

(define-map user-mint-count
  principal
  uint)

(define-map token-updates
  uint
  {
    update-title: (string-utf8 100),
    update-description: (string-utf8 500),
    update-media-link: (optional (string-utf8 200)),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-token (id uint))
  (map-get? tokens id)
)

(define-read-only (get-token-owner (id uint))
  (map-get? token-owners id)
)

(define-read-only (get-user-mint-count (user principal))
  (default-to u0 (map-get? user-mint-count user))
)

(define-read-only (get-token-updates (id uint))
  (map-get? token-updates id)
)

(define-private (validate-title (title (string-utf8 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (<= (len desc) u500)
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-media-link (link (optional (string-utf8 200))))
  (match link l
    (if (<= (len l) u200)
        (ok true)
        (err ERR-INVALID-MEDIA-LINK))
    (ok true))
)

(define-private (validate-content-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-provenance-id (id (optional uint)))
  (match id pid
    (if (> pid u0)
        (ok true)
        (err ERR-INVALID-PROVENANCE-ID))
    (ok true))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-owner (owner principal))
  (if (not (is-eq owner 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-OWNER))
)

(define-private (validate-recipient (recipient principal))
  (if (not (is-eq recipient 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-RECIPIENT))
)

(define-public (set-provenance-tracker (contract-principal principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (try! (validate-owner contract-principal))
    (var-set provenance-tracker (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-mint-per-user (new-max uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (var-set max-mint-per-user new-max)
    (ok true)
  )
)

(define-public (toggle-mint-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err ERR-NOT-AUTHORIZED))
    (var-set mint-paused (not (var-get mint-paused)))
    (ok (var-get mint-paused))
  )
)

(define-public (mint-story
  (content-hash (buff 32))
  (title (string-utf8 100))
  (description (string-utf8 500))
  (media-link (optional (string-utf8 200)))
  (provenance-id (optional uint))
)
  (let (
        (next-id (var-get next-token-id))
        (user-count (get-user-mint-count tx-sender))
        (prov (var-get provenance-tracker))
      )
    (asserts! (not (var-get mint-paused)) (err ERR-MINT-PAUSED))
    (asserts! (< user-count (var-get max-mint-per-user)) (err ERR-MAX-MINT-EXCEEDED))
    (try! (validate-content-hash content-hash))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-media-link media-link))
    (try! (validate-provenance-id provenance-id))
    (asserts! (is-none (map-get? tokens next-id)) (err ERR-TOKEN-ALREADY-EXISTS))
    (asserts! (is-some prov) (err ERR-PROVENANCE-NOT-SET))
    (map-set tokens next-id
      {
        owner: tx-sender,
        content-hash: content-hash,
        title: title,
        description: description,
        media-link: media-link,
        timestamp: block-height,
        provenance-id: provenance-id
      }
    )
    (map-set token-owners next-id tx-sender)
    (map-set user-mint-count tx-sender (+ user-count u1))
    (var-set next-token-id (+ next-id u1))
    (print { event: "story-minted", id: next-id })
    (ok next-id)
  )
)

(define-public (transfer-story (id uint) (recipient principal))
  (let ((token (map-get? tokens id)))
    (match token t
      (begin
        (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-recipient recipient))
        (map-set tokens id (merge t { owner: recipient }))
        (map-set token-owners id recipient)
        (print { event: "story-transferred", id: id, to: recipient })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (burn-story (id uint))
  (let ((token (map-get? tokens id)))
    (match token t
      (begin
        (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
        (map-delete tokens id)
        (map-delete token-owners id)
        (print { event: "story-burned", id: id })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (update-story-metadata
  (id uint)
  (new-title (string-utf8 100))
  (new-description (string-utf8 500))
  (new-media-link (optional (string-utf8 200)))
)
  (let ((token (map-get? tokens id)))
    (match token t
      (begin
        (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
        (try! (validate-title new-title))
        (try! (validate-description new-description))
        (try! (validate-media-link new-media-link))
        (map-set tokens id
          (merge t {
            title: new-title,
            description: new-description,
            media-link: new-media-link,
            timestamp: block-height
          })
        )
        (map-set token-updates id
          {
            update-title: new-title,
            update-description: new-description,
            update-media-link: new-media-link,
            update-timestamp: block-height,
            updater: tx-sender
          }
        )
        (print { event: "story-updated", id: id })
        (ok true)
      )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (get-next-token-id)
  (ok (var-get next-token-id))
)

(define-public (verify-owner (id uint) (claimed-owner principal))
  (match (map-get? token-owners id)
    owner (ok (is-eq owner claimed-owner))
    (err ERR-TOKEN-NOT-FOUND)
  )
)