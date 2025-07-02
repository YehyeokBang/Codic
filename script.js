// 프로젝트 목록(동적 관리)
let projects = [
  { key: "voting-app", name: "투표 서비스", link: "" },
  { key: "ecommerce", name: "이커머스", link: "" },
  { key: "chat-app", name: "채팅 앱", link: "" },
];

// Mock Data - 태그 제거, 프로젝트는 key로 연결
const mockIntentions = [
  {
    id: 1,
    title: "다중 투표를 위한 복합 키 설계",
    code: `@Entity
public class Vote {
    @EmbeddedId
    private VoteId id;
    
    private String choice;
    private LocalDateTime votedAt;
}

@Embeddable
public class VoteId {
    private Long pollId;
    private String userId;
    private String sessionId; // 익명 투표를 위한 세션 ID
}`,
    intention:
      "이 설계는 익명 투표와 실명 투표를 모두 지원하기 위해 복합 키를 사용했습니다. sessionId를 포함함으로써 나중에 익명이 아닌 투표로 전환할 때도 기존 데이터 구조를 유지할 수 있습니다. 또한 한 사용자가 여러 번 투표할 수 있는 다중 투표 기능도 고려했습니다.",
    project: "voting-app",
    metadata:
      "커밋 해시: a1b2c3d4\n파일 경로: src/main/java/com/vote/entity/Vote.java\n참고: JPA 복합 키 설계 가이드",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    title: "Redis 캐시를 활용한 투표 결과 실시간 집계",
    code: `@Service
public class VoteAggregationService {
    private final RedisTemplate<String, String> redisTemplate;
    
    public void incrementVoteCount(Long pollId, String choice) {
        String key = "vote:count:" + pollId + ":" + choice;
        redisTemplate.opsForValue().increment(key);
        
        // 실시간 알림을 위한 이벤트 발행
        publishVoteUpdateEvent(pollId, choice);
    }
    
    public Map<String, Long> getVoteCounts(Long pollId) {
        Set<String> keys = redisTemplate.keys("vote:count:" + pollId + ":*");
        Map<String, Long> counts = new HashMap<>();
        
        for (String key : keys) {
            String choice = key.split(":")[3];
            String count = redisTemplate.opsForValue().get(key);
            counts.put(choice, Long.parseLong(count));
        }
        
        return counts;
    }
}`,
    intention:
      "Redis의 INCR 명령어를 사용하여 투표 결과를 실시간으로 집계합니다. 이 방식은 데이터베이스 부하를 줄이고 실시간 업데이트를 가능하게 합니다. 또한 이벤트 발행을 통해 웹소켓으로 실시간 결과를 클라이언트에 전송할 수 있습니다.",
    project: "voting-app",
    metadata:
      "커밋 해시: e5f6g7h8\n파일 경로: src/main/java/com/vote/service/VoteAggregationService.java\nRedis 버전: 6.2",
    createdAt: "2024-01-16T14:20:00Z",
  },
  {
    id: 3,
    title: "JWT 토큰 검증을 위한 커스텀 필터",
    code: `@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractTokenFromRequest(request);
        
        if (token != null && jwtTokenProvider.validateToken(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userId, null, null);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}`,
    intention:
      "Spring Security의 필터 체인에 JWT 토큰 검증을 추가했습니다. 이 필터는 모든 요청에서 Authorization 헤더를 확인하고, 유효한 JWT 토큰이 있으면 SecurityContext에 인증 정보를 설정합니다. 이를 통해 API 엔드포인트에서 @PreAuthorize 어노테이션을 사용할 수 있습니다.",
    project: "voting-app",
    metadata:
      "커밋 해시: i9j0k1l2\n파일 경로: src/main/java/com/vote/config/JwtAuthenticationFilter.java\nSpring Security 버전: 5.8",
    createdAt: "2024-01-17T09:15:00Z",
  },
  {
    id: 4,
    title: "상품 재고 관리를 위한 낙관적 락 구현",
    code: `@Service
@Transactional
public class InventoryService {
    
    public boolean decreaseStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));
        
        if (product.getStock() < quantity) {
            throw new InsufficientStockException(productId, quantity);
        }
        
        // 낙관적 락을 위한 버전 체크
        int updatedRows = productRepository.decreaseStockWithVersion(
            productId, quantity, product.getVersion());
        
        if (updatedRows == 0) {
            throw new OptimisticLockException("재고가 다른 사용자에 의해 변경되었습니다.");
        }
        
        return true;
    }
}`,
    intention:
      "동시에 여러 사용자가 같은 상품을 구매할 때 발생할 수 있는 재고 중복 감소 문제를 해결하기 위해 낙관적 락을 사용했습니다. @Version 어노테이션을 통해 엔티티의 버전을 관리하고, 업데이트 시 버전이 일치하지 않으면 예외를 발생시킵니다. 이는 데이터베이스 락보다 성능상 유리합니다.",
    project: "ecommerce",
    metadata:
      "커밋 해시: m3n4o5p6\n파일 경로: src/main/java/com/ecommerce/service/InventoryService.java\nJPA 버전: 2.7",
    createdAt: "2024-01-18T16:45:00Z",
  },
  {
    id: 5,
    title: "WebSocket을 활용한 실시간 채팅 구현",
    code: `@Controller
public class ChatController {
    
    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        
        // 메시지 저장
        chatMessageRepository.save(chatMessage);
        
        return chatMessage;
    }
    
    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        // 사용자 퇴장 처리
        userService.handleUserDisconnect(sessionId);
    }
}`,
    intention:
      "Spring WebSocket을 사용하여 실시간 채팅 기능을 구현했습니다. @MessageMapping으로 클라이언트로부터 메시지를 받고, @SendTo로 구독자들에게 브로드캐스트합니다. 세션 연결/해제 이벤트도 처리하여 사용자 상태를 관리합니다. 이는 폴링 방식보다 효율적이고 실시간성이 보장됩니다.",
    project: "chat-app",
    metadata:
      "커밋 해시: q7r8s9t0\n파일 경로: src/main/java/com/chat/controller/ChatController.java\nSpring WebSocket 버전: 5.3",
    createdAt: "2024-01-19T11:30:00Z",
  },
];

let currentIntentions = [...mockIntentions];
let currentFilter = { project: "all", search: "" };
let editingIntentionId = null;
let tempIntentionData = null; // 2단계용 임시 저장

// 여러 코드 스니펫 입력 지원 상태
let codeSnippets = [{ code: "", codeLang: "auto" }];

// DOM Elements
const intentionsList = document.getElementById("intentionsList");
const searchInput = document.getElementById("searchInput");
const addNewBtn = document.getElementById("addNewBtn");
const intentionModal = document.getElementById("intentionModal");
const metaModal = document.getElementById("metaModal");
const detailModal = document.getElementById("detailModal");
const intentionForm = document.getElementById("intentionForm");
const metaForm = document.getElementById("metaForm");
const closeModal = document.getElementById("closeModal");
const closeMetaModal = document.getElementById("closeMetaModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const cancelBtn = document.getElementById("cancelBtn");
const metaBackBtn = document.getElementById("metaBackBtn");
const projectList = document.getElementById("projectList");
const addProjectBtn = document.getElementById("addProjectBtn");
const projectModal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm");
const closeProjectModal = document.getElementById("closeProjectModal");
const projectCancelBtn = document.getElementById("projectCancelBtn");

// 초기화
window.addEventListener("DOMContentLoaded", function () {
  renderProjects();
  renderIntentions();
  setupEventListeners();
  setupNavigation();
  renderTipSlider();
  startTipAutoSlide();
});

// ESC로 모달 닫기 지원
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (intentionModal.classList.contains("show")) closeIntentionModal();
    if (metaModal.classList.contains("show")) closeMetaModalHandler();
    if (detailModal.classList.contains("show")) closeDetailModalHandler();
    if (projectModal.classList.contains("show"))
      projectModal.classList.remove("show");
  }
});

// 붙여넣기 시 모달이 열려있으면 기존 모달 닫고 새 의도 기록 모달로 전환
window.addEventListener("paste", function (e) {
  // 코드 스니펫 작성 모달이 열려 있으면 붙여넣기 이벤트 무시
  if (intentionModal.classList.contains("show")) return;
  const text = e.clipboardData.getData("text");
  if (text && text.match(/[{};=\n]/)) {
    if (metaModal.classList.contains("show")) closeMetaModalHandler();
    if (detailModal.classList.contains("show")) closeDetailModalHandler();
    if (projectModal.classList.contains("show"))
      projectModal.classList.remove("show");
    setTimeout(() => openAddModal(text), 50);
    e.preventDefault();
  }
});

function setupEventListeners() {
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  addNewBtn.addEventListener("click", () => openAddModal());
  closeModal.addEventListener("click", closeIntentionModal);
  closeMetaModal.addEventListener("click", closeMetaModalHandler);
  closeDetailModal.addEventListener("click", closeDetailModalHandler);
  cancelBtn.addEventListener("click", closeIntentionModal);
  metaBackBtn.addEventListener("click", function () {
    metaModal.classList.remove("show");
    intentionModal.classList.add("show");
  });
  intentionForm.addEventListener("submit", handleFormStep1Submit);
  metaForm.addEventListener("submit", handleFormStep2Submit);
  intentionModal.addEventListener("click", (e) => {
    if (e.target === intentionModal) closeIntentionModal();
  });
  metaModal.addEventListener("click", (e) => {
    if (e.target === metaModal) closeMetaModalHandler();
  });
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeDetailModalHandler();
  });
  // 프로젝트 추가
  addProjectBtn.addEventListener("click", () =>
    projectModal.classList.add("show")
  );
  closeProjectModal.addEventListener("click", () =>
    projectModal.classList.remove("show")
  );
  projectCancelBtn.addEventListener("click", () =>
    projectModal.classList.remove("show")
  );
  projectForm.addEventListener("submit", handleProjectFormSubmit);
  // 1단계에서 엔터로 다음(2단계) 이동, 2단계에서도 엔터로 저장까지 연속 진행
  intentionForm.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      const active = document.activeElement;
      if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
        e.preventDefault();
        // 입력값을 직접 상태에 반영
        if (active.classList.contains("code-snippet-textarea")) {
          const idx = active.dataset.idx;
          if (typeof idx !== "undefined") codeSnippets[idx].code = active.value;
        } else if (active.name === "title") {
          // 제목 input
          // 별도 상태 없음, formData에서 읽음
        } else if (active.name === "intention") {
          // 의도 설명 textarea
          // 별도 상태 없음, formData에서 읽음
        }
        setTimeout(() => {
          this.querySelector('button[type="submit"]').click();
          setTimeout(() => {
            if (metaModal.classList.contains("show")) {
              const first = metaForm.querySelector("input, textarea");
              if (first) first.focus();
            }
          }, 200);
        }, 10);
      }
    }
  });
  metaForm.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      const active = document.activeElement;
      if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") {
        e.preventDefault();
        // 입력값을 직접 상태에 반영 (추가정보는 formData에서 읽으므로 별도 처리 불필요)
        setTimeout(() => {
          this.querySelector('button[type="submit"]').click();
        }, 10);
      }
    }
  });
}

function setupNavigation() {
  // 프로젝트 목록 클릭 이벤트 위임
  projectList.addEventListener("click", function (e) {
    const item = e.target.closest(".project-item");
    if (!item) return;
    if (e.target.classList.contains("project-delete-btn")) {
      // 삭제
      const key = item.dataset.key;
      projects = projects.filter((p) => p.key !== key);
      if (currentFilter.project === key) currentFilter.project = "all";
      renderProjects();
      renderIntentions();
      return;
    }
    // 필터링
    document
      .querySelectorAll(".project-item")
      .forEach((el) => el.classList.remove("active"));
    item.classList.add("active");
    currentFilter.project = item.dataset.key;
    renderIntentions();
  });
}

function handleSearch() {
  currentFilter.search = searchInput.value.toLowerCase();
  renderIntentions();
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function filterIntentions() {
  return currentIntentions.filter((intention) => {
    if (
      currentFilter.project !== "all" &&
      intention.project !== currentFilter.project
    )
      return false;
    if (currentFilter.search) {
      const s = currentFilter.search;
      return (
        intention.title.toLowerCase().includes(s) ||
        intention.code.toLowerCase().includes(s) ||
        intention.intention.toLowerCase().includes(s)
      );
    }
    return true;
  });
}

// detectLanguage에서 추가 언어 지원
function detectLanguage(code) {
  const result = window.hljs.highlightAuto(code, [
    "java",
    "kotlin",
    "go",
    "cpp",
    "c",
    "typescript",
    "javascript",
    "sql",
    "python",
    "bash",
    "json",
    "xml",
    "plaintext",
  ]);
  return result.language || "plaintext";
}

// 코드 카드/상세 코드 클릭 시 자동 복사
function enableCodeCopy() {
  document.querySelectorAll(".card-code, .detail-code").forEach((block) => {
    block.setAttribute("data-copy", "true");
    block.setAttribute("title", "클릭 시 코드 복사");
    block.style.cursor = "pointer";
    block.onclick = function (e) {
      const code = this.innerText;
      navigator.clipboard.writeText(code).then(() => {
        showNotification("코드가 복사되었습니다!");
      });
      e.stopPropagation();
    };
  });
}

function renderIntentions() {
  const filtered = filterIntentions().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  if (filtered.length === 0) {
    intentionsList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">의도 기록이 없습니다</div><div class="empty-state-description">${
      currentFilter.search
        ? "검색 결과가 없습니다."
        : "새로운 코드 의도를 기록해보세요!"
    }</div>${
      !currentFilter.search
        ? '<button class="btn-primary" onclick="openAddModal()">첫 기록 작성하기</button>'
        : ""
    }</div>`;
    return;
  }
  intentionsList.innerHTML = filtered
    .map((intention) => {
      const project = projects.find((p) => p.key === intention.project);
      let codeBlock = "";
      if (
        Array.isArray(intention.codeSnippets) &&
        intention.codeSnippets.length
      ) {
        const s = intention.codeSnippets[0];
        const lang = s.codeLang || detectLanguage(s.code);
        codeBlock = `<pre class="card-code" data-detail="true"><code class="language-${lang}">${escapeHtml(
          s.code
        )}</code></pre>`;
      } else {
        const lang = intention.codeLang || detectLanguage(intention.code);
        codeBlock = `<pre class="card-code" data-detail="true"><code class="language-${lang}">${escapeHtml(
          intention.code
        )}</code></pre>`;
      }
      return `<div class="intention-card" data-id="${intention.id}">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(intention.title)}</div>
          <span class="card-project">${
            project
              ? project.link
                ? `<a href="${
                    project.link
                  }" class="project-link" target="_blank">${escapeHtml(
                    project.name
                  )}</a>`
                : escapeHtml(project.name)
              : ""
          }</span>
        </div>
        <div class="card-date">${formatDate(intention.createdAt)}</div>
      </div>
      <div class="card-content">
        ${codeBlock}
        <div class="card-intention">${escapeHtml(intention.intention)}</div>
      </div>
      <div class="card-footer">
        <div></div>
        <div class="card-actions">
          <button class="card-action-btn" onclick="editIntention(${
            intention.id
          })" title="편집">✏️</button>
          <button class="card-action-btn" onclick="deleteIntention(${
            intention.id
          })" title="삭제">🗑️</button>
        </div>
      </div>
    </div>`;
    })
    .join("");
  document
    .querySelectorAll(".card-code code")
    .forEach((block) => window.hljs.highlightElement(block));
  // 카드 코드 클릭 시 상세 이동
  document
    .querySelectorAll('.card-code[data-detail="true"]')
    .forEach((block) => {
      block.onclick = function (e) {
        const card = this.closest(".intention-card");
        if (card) {
          const id = parseInt(card.dataset.id);
          openDetailModal(id);
        }
        e.stopPropagation();
      };
      block.style.cursor = "pointer";
      block.title = "상세 보기";
    });
  document.querySelectorAll(".intention-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".card-actions")) return;
      const id = parseInt(this.dataset.id);
      openDetailModal(id);
    });
  });
}

function renderProjects() {
  projectList.innerHTML =
    `<div class="project-item${
      currentFilter.project === "all" ? " active" : ""
    }" data-key="all"><span class="nav-icon">📁</span>전체 보기</div>` +
    projects
      .map(
        (p, idx) =>
          `<div class="project-item${
            currentFilter.project === p.key ? " active" : ""
          }${idx === 0 ? " default-project-highlight" : ""}" data-key="${
            p.key
          }" draggable="true">
          <span class="nav-icon">📁</span>${escapeHtml(p.name)}${
            p.link
              ? `<a href="${p.link}" class="project-link" target="_blank">🔗</a>`
              : ""
          }
          <button class="project-delete-btn" title="삭제">×</button>
        </div>`
      )
      .join("");
}

function openAddModal(pastedCode = "") {
  editingIntentionId = null;
  tempIntentionData = null;
  document.getElementById("modalTitle").textContent = "새 의도 기록";
  intentionForm.reset();
  codeSnippets = [{ code: pastedCode, codeLang: "auto" }];
  renderCodeSnippets();
  intentionModal.classList.add("show");
  setTimeout(() => {
    const first = document.querySelector(".code-snippet-textarea");
    if (first) first.focus();
  }, 100);
}

function openEditModal(id) {
  editingIntentionId = id;
  const intention = currentIntentions.find((i) => i.id === id);
  if (!intention) return;
  document.getElementById("modalTitle").textContent = "의도 기록 편집";
  intentionForm.reset();
  // 여러 코드 스니펫 지원
  if (Array.isArray(intention.codeSnippets)) {
    codeSnippets = intention.codeSnippets.map((s) => ({ ...s }));
  } else {
    codeSnippets = [
      { code: intention.code, codeLang: intention.codeLang || "auto" },
    ];
  }
  renderCodeSnippets();
  // 제목/의도 설명 값도 세팅
  document.getElementById("title").value = intention.title || "";
  document.getElementById("intention").value = intention.intention || "";
  intentionModal.classList.add("show");
  setTimeout(() => {
    const first = document.querySelector(".code-snippet-textarea");
    if (first) first.focus();
  }, 100);
}

function closeIntentionModal() {
  intentionModal.classList.remove("show");
  tempIntentionData = null;
  editingIntentionId = null;
}

function closeMetaModalHandler() {
  metaModal.classList.remove("show");
  tempIntentionData = null;
}

function openDetailModal(id) {
  const intention = currentIntentions.find((i) => i.id === id);
  if (!intention) return;
  const project = projects.find((p) => p.key === intention.project);
  let codeBlocks = "";
  if (Array.isArray(intention.codeSnippets) && intention.codeSnippets.length) {
    codeBlocks = intention.codeSnippets
      .map((s) => {
        const lang = s.codeLang || detectLanguage(s.code);
        return `<pre class="detail-code" data-copy="true"><code class="language-${lang}">${escapeHtml(
          s.code
        )}</code></pre>`;
      })
      .join("");
  } else {
    const lang = intention.codeLang || detectLanguage(intention.code);
    codeBlocks = `<pre class="detail-code" data-copy="true"><code class="language-${lang}">${escapeHtml(
      intention.code
    )}</code></pre>`;
  }
  document.getElementById("detailTitle").textContent = intention.title;
  document.getElementById("detailContent").innerHTML = `
    <div class="detail-section">
      <h3>코드 스니펫</h3>
      ${codeBlocks}
    </div>
    <div class="detail-section">
      <h3>의도 설명</h3>
      <div class="detail-intention">${escapeHtml(intention.intention)}</div>
    </div>
    <div class="detail-section">
      <h3>메타데이터</h3>
      <div class="detail-meta">
        <div class="meta-item">
          <div class="meta-label">프로젝트</div>
          <div class="meta-value">${
            project
              ? project.link
                ? `<a href="${
                    project.link
                  }" class="project-link" target="_blank">${escapeHtml(
                    project.name
                  )}</a>`
                : escapeHtml(project.name)
              : ""
          }</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">작성일</div>
          <div class="meta-value">${formatDate(intention.createdAt)}</div>
        </div>
        ${
          intention.commitHash
            ? `<div class="meta-item"><div class="meta-label">깃허브 커밋 해시</div><div class="meta-value">${escapeHtml(
                intention.commitHash
              )}</div></div>`
            : ""
        }
        ${
          intention.filePath
            ? `<div class="meta-item"><div class="meta-label">파일 경로</div><div class="meta-value">${escapeHtml(
                intention.filePath
              )}</div></div>`
            : ""
        }
        ${
          intention.reference
            ? `<div class="meta-item"><div class="meta-label">참고 자료</div><div class="meta-value">${escapeHtml(
                intention.reference
              )}</div></div>`
            : ""
        }
      </div>
    </div>
  `;
  detailModal.classList.add("show");
  document
    .querySelectorAll(".detail-code code")
    .forEach((block) => window.hljs.highlightElement(block));
  // 상세 모달에서만 코드 복사
  document
    .querySelectorAll('.detail-code[data-copy="true"]')
    .forEach((block) => {
      block.onclick = function (e) {
        const code = this.innerText;
        navigator.clipboard.writeText(code).then(() => {
          showNotification("코드가 복사되었습니다!");
        });
        e.stopPropagation();
      };
      block.style.cursor = "pointer";
      block.title = "클릭 시 코드 복사";
    });
}

function closeDetailModalHandler() {
  detailModal.classList.remove("show");
}

// 1단계: 여러 코드 스니펫 저장
function handleFormStep1Submit(e) {
  e.preventDefault();
  if (!codeSnippets.length || codeSnippets.some((s) => !s.code.trim())) {
    showNotification("코드 스니펫을 1개 이상 입력하세요.");
    return;
  }
  const formData = new FormData(intentionForm);
  tempIntentionData = {
    title: formData.get("title"),
    codeSnippets: codeSnippets.map((s) => ({ ...s })),
    intention: formData.get("intention"),
    project:
      currentFilter.project !== "all"
        ? currentFilter.project
        : projects[0]?.key || "",
    createdAt: new Date().toISOString(),
    commitHash: "",
    filePath: "",
    reference: "",
  };
  intentionModal.classList.remove("show");
  metaModal.classList.add("show");
}

// 2단계: 추가 정보 입력 (분리)
function handleFormStep2Submit(e) {
  e.preventDefault();
  const formData = new FormData(metaForm);
  tempIntentionData.commitHash = formData.get("commitHash");
  tempIntentionData.filePath = formData.get("filePath");
  tempIntentionData.reference = formData.get("reference");
  if (editingIntentionId) {
    const idx = currentIntentions.findIndex((i) => i.id === editingIntentionId);
    if (idx !== -1)
      currentIntentions[idx] = {
        ...currentIntentions[idx],
        ...tempIntentionData,
      };
  } else {
    const newId = Math.max(0, ...currentIntentions.map((i) => i.id)) + 1;
    currentIntentions.push({ id: newId, ...tempIntentionData });
  }
  metaModal.classList.remove("show");
  tempIntentionData = null;
  renderIntentions();
  showNotification(
    editingIntentionId
      ? "의도 기록이 수정되었습니다."
      : "새 의도 기록이 추가되었습니다."
  );
}

function editIntention(id) {
  openEditModal(id);
}

function deleteIntention(id) {
  if (confirm("정말로 이 의도 기록을 삭제하시겠습니까?")) {
    currentIntentions = currentIntentions.filter((i) => i.id !== id);
    renderIntentions();
    showNotification("의도 기록이 삭제되었습니다.");
  }
}

function handleProjectFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(projectForm);
  const name = formData.get("projectName").trim();
  const link = formData.get("projectLink").trim();
  if (!name) return;
  const key =
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "") +
    "-" +
    Date.now();
  projects.unshift({ key, name, link });
  renderProjects();
  projectModal.classList.remove("show");
  projectForm.reset();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.style.cssText = `position: fixed; top: 20px; right: 20px; background: #3182f6; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease;`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

const style = document.createElement("style");
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
document.head.appendChild(style);

function renderCodeSnippets() {
  const group = document.getElementById("codeSnippetsGroup");
  if (!group) return;
  group.innerHTML = `<div class="code-snippet-list">
    ${codeSnippets
      .map(
        (snippet, idx) => `
      <div class="code-snippet-item">
        <div class="code-snippet-header">
          <span>코드</span>
          <select class="code-lang-pill" data-idx="${idx}">
            <option value="auto">언어 자동감지</option>
            <option value="java">Java</option>
            <option value="kotlin">Kotlin</option>
            <option value="go">Go</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="sql">SQL</option>
            <option value="python">Python</option>
            <option value="bash">Bash</option>
            <option value="json">JSON</option>
            <option value="xml">XML</option>
            <option value="plaintext">Plain Text</option>
          </select>
        </div>
        <div class="code-snippet-block">
          <textarea class="code-snippet-textarea" data-idx="${idx}" placeholder="코드를 여기에 붙여넣으세요" style="min-height:220px;">${
          snippet.code || ""
        }</textarea>
        </div>
        ${
          codeSnippets.length > 1
            ? `<button type="button" class="code-snippet-delete-btn" data-idx="${idx}" title="삭제">×</button>`
            : ""
        }
      </div>
    `
      )
      .join("")}
  </div>`;
  // 이벤트 바인딩
  group.querySelectorAll(".code-lang-pill").forEach((sel) => {
    sel.value = codeSnippets[sel.dataset.idx].codeLang;
    sel.onchange = (e) => {
      codeSnippets[sel.dataset.idx].codeLang = sel.value;
    };
  });
  group.querySelectorAll(".code-snippet-textarea").forEach((area) => {
    area.oninput = (e) => {
      codeSnippets[area.dataset.idx].code = area.value;
    };
  });
  group.querySelectorAll(".code-snippet-delete-btn").forEach((btn) => {
    btn.onclick = (e) => {
      codeSnippets.splice(btn.dataset.idx, 1);
      renderCodeSnippets();
    };
  });
}

document.getElementById("addCodeSnippetBtn").onclick = function () {
  codeSnippets.push({ code: "", codeLang: "auto" });
  renderCodeSnippets();
};

// 프로젝트 드래그 앤 드롭 기능 (실시간 가이드)
let dragSrcIdx = null;
let lastDragOverIdx = null;
projectList.addEventListener("dragstart", function (e) {
  const item = e.target.closest(".project-item");
  if (!item || item.dataset.key === "all") return;
  dragSrcIdx = projects.findIndex((p) => p.key === item.dataset.key);
  e.dataTransfer.effectAllowed = "move";
  item.classList.add("dragging");
});
projectList.addEventListener("dragend", function (e) {
  document
    .querySelectorAll(".project-item")
    .forEach((el) => el.classList.remove("dragging", "drag-over"));
  lastDragOverIdx = null;
});
projectList.addEventListener("dragover", function (e) {
  e.preventDefault();
  const items = Array.from(
    projectList.querySelectorAll('.project-item:not([data-key="all"])')
  );
  const mouseY = e.clientY;
  let targetIdx = -1;
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    if (mouseY < rect.top + rect.height / 2) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx === -1) targetIdx = items.length;
  // drag-over 가이드 적용
  items.forEach((el, idx) => el.classList.remove("drag-over"));
  if (targetIdx < items.length) items[targetIdx].classList.add("drag-over");
  lastDragOverIdx = targetIdx;
});
projectList.addEventListener("dragleave", function (e) {
  const item = e.target.closest(".project-item");
  if (item) item.classList.remove("drag-over");
});
projectList.addEventListener("drop", function (e) {
  e.preventDefault();
  const items = Array.from(
    projectList.querySelectorAll('.project-item:not([data-key="all"])')
  );
  let dropIdx = lastDragOverIdx;
  if (dropIdx === null) return;
  if (dragSrcIdx !== null && dropIdx !== dragSrcIdx) {
    const moved = projects.splice(dragSrcIdx, 1)[0];
    projects.splice(dropIdx, 0, moved);
    renderProjects();
  }
  document
    .querySelectorAll(".project-item")
    .forEach((el) => el.classList.remove("drag-over", "dragging"));
  dragSrcIdx = null;
  document
    .querySelectorAll(".project-item")
    .forEach((el) => el.classList.remove("drag-over"));
  dragSrcIdx = null;
});

// 꿀팁 슬라이드 데이터 및 렌더 함수 추가
const tips = [
  "최상단 프로젝트가 기본 프로젝트이며, 드래그 앤 드랍으로 순서를 변경할 수 있다.",
  "코드 복사 붙여넣기하는 경우 바로 스니펫을 저장할 수 있다.",
  "기록에서 코드 블럭을 누르면 자동으로 코드 조각이 복사된다.",
  "특정 프로젝트를 누른 상태로 스니펫을 추가하면 해당 프로젝트에 추가된다.",
  "코드 의도는 2단계로 입력하며, 추가정보(커밋, 파일, 참고)도 기록할 수 있다.",
];
let tipIdx = 0;
let tipAutoSlideTimer = null;

function renderTipSlider() {
  const tipArea = document.getElementById("tipSliderArea");
  if (!tipArea) return;
  tipArea.innerHTML = `
    <div class="tip-slider">
      <span class="tip-label" id="tipLabelBtn" style="cursor:pointer;">Tip</span>
      <div class="tip-content">${tips[tipIdx]}</div>
      <button class="tip-next-btn" id="tipNextBtn" aria-label="다음 꿀팁" title="다음 꿀팁 보기">&gt;</button>
    </div>
  `;
  document.getElementById("tipNextBtn").onclick = () => {
    tipIdx = (tipIdx + 1) % tips.length;
    renderTipSlider();
    startTipAutoSlide();
  };
  document.getElementById("tipLabelBtn").onclick = showAllTipsModal;
}

function startTipAutoSlide() {
  if (tipAutoSlideTimer) clearTimeout(tipAutoSlideTimer);
  tipAutoSlideTimer = setTimeout(() => {
    tipIdx = (tipIdx + 1) % tips.length;
    renderTipSlider();
    startTipAutoSlide();
  }, 5000);
}

// 팁 전체 보기 모달
function showAllTipsModal() {
  let modal = document.getElementById("allTipsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "allTipsModal";
    modal.className = "modal show";
    modal.innerHTML = `
      <div class="modal-content tips-modal-content">
        <div class="modal-header">
          <h2>모든 Tip</h2>
          <button class="close-button" id="closeAllTipsModal">&times;</button>
        </div>
        <ul class="all-tips-list">
          ${tips
            .map(
              (tip, i) =>
                `<li class="all-tips-item${
                  i === tipIdx ? " active" : ""
                }">${tip}</li>`
            )
            .join("")}
        </ul>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("closeAllTipsModal").onclick = () => {
      modal.classList.remove("show");
      setTimeout(() => modal.remove(), 300);
    };
    // ESC로 닫기
    function escHandler(e) {
      if (e.key === "Escape") {
        modal.classList.remove("show");
        setTimeout(() => modal.remove(), 300);
        window.removeEventListener("keydown", escHandler);
      }
    }
    window.addEventListener("keydown", escHandler);
  }
}
