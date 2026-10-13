"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  choseongOf,
  digitsOnly,
  formatPhone,
  formatPhoneLive,
  indexLetter,
  INDEX_ORDER,
  isChoseongQuery,
} from "@/lib/phone";
import { DEFAULT_GROUPS, type Contact, type ContactInput } from "@/lib/types";

type Props = {
  initial: Contact[];
  configured: boolean;
  loadError?: string | null;
};

type Filter = "all" | "fav" | { group: string };

const EMPTY_FORM: ContactInput = {
  name: "",
  phone: "",
  group_name: "기타",
  memo: "",
  favorite: false,
};

function byName(a: Contact, b: Contact) {
  return a.name.localeCompare(b.name, "ko");
}

export default function PhoneBook({ initial, configured, loadError }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(() => [...initial].sort(byName));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<"new" | Contact | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ---------- 파생 데이터 ----------
  const groups = useMemo(() => {
    const set = new Set<string>(DEFAULT_GROUPS);
    contacts.forEach((c) => set.add(c.group_name));
    return Array.from(set);
  }, [contacts]);

  const visible = useMemo(() => {
    const q = query.trim();
    const qDigits = digitsOnly(q);
    const qLower = q.toLowerCase();
    const choQuery = isChoseongQuery(q);

    return contacts.filter((c) => {
      if (filter === "fav" && !c.favorite) return false;
      if (typeof filter === "object" && c.group_name !== filter.group) return false;
      if (!q) return true;
      if (choQuery && choseongOf(c.name).includes(q)) return true;
      if (c.name.toLowerCase().includes(qLower)) return true;
      if (qDigits.length >= 2 && digitsOnly(c.phone).includes(qDigits)) return true;
      if (c.group_name.toLowerCase().includes(qLower)) return true;
      if (c.memo.toLowerCase().includes(qLower)) return true;
      return false;
    });
  }, [contacts, query, filter]);

  const sections = useMemo(() => {
    const map = new Map<string, Contact[]>();
    visible.forEach((c) => {
      const letter = indexLetter(c.name);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(c);
    });
    return INDEX_ORDER.filter((l) => map.has(l)).map((letter) => ({
      letter,
      items: map.get(letter)!,
    }));
  }, [visible]);

  const presentLetters = useMemo(
    () => new Set(sections.map((s) => s.letter)),
    [sections],
  );

  // ---------- 토스트 ----------
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- 데이터 조작 ----------
  async function save(input: ContactInput, id?: string): Promise<string | null> {
    const supabase = getSupabase();
    const payload = {
      name: input.name.trim(),
      phone: formatPhone(input.phone),
      group_name: input.group_name.trim() || "기타",
      memo: input.memo.trim(),
      favorite: input.favorite,
    };

    if (id) {
      const { data, error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) return error.message;
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? (data as Contact) : c)).sort(byName),
      );
      setToast("수정했습니다");
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert(payload)
        .select()
        .single();
      if (error) return error.message;
      setContacts((prev) => [...prev, data as Contact].sort(byName));
      setToast(`${payload.name} 님을 저장했습니다`);
    }
    return null;
  }

  async function remove(id: string): Promise<string | null> {
    const supabase = getSupabase();
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) return error.message;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setToast("삭제했습니다");
    return null;
  }

  async function toggleFavorite(c: Contact) {
    const next = !c.favorite;
    setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, favorite: next } : x)));
    const { error } = await getSupabase()
      .from("contacts")
      .update({ favorite: next })
      .eq("id", c.id);
    if (error) {
      setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, favorite: !next } : x)));
      setToast(`즐겨찾기 변경 실패: ${error.message}`);
    }
  }

  async function copyPhone(c: Contact) {
    try {
      await navigator.clipboard.writeText(c.phone);
      setToast(`${c.phone} 복사됨`);
    } catch {
      setToast("복사할 수 없습니다. 번호를 직접 선택해 주세요");
    }
  }

  // ---------- 렌더 ----------
  return (
    <>
      <header className="header">
        <div className="wrap header-inner">
          <div className="brand">
            <h1>번호수첩</h1>
            <span className="count mono">
              {visible.length === contacts.length
                ? `${contacts.length}명`
                : `${visible.length} / ${contacts.length}명`}
            </span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditing("new")}
              disabled={!configured}
            >
              + 연락처 추가
            </button>
          </div>
        </div>
      </header>

      <main className="wrap">
        {!configured && (
          <div className="notice">
            <strong>Supabase 연결 정보가 없습니다.</strong>
            <p style={{ margin: "6px 0 0" }}>
              <code>.env.local</code> 파일에 <code>NEXT_PUBLIC_SUPABASE_URL</code> 과{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 넣고 서버를 다시 시작하세요.
              Vercel 에서는 Project Settings → Environment Variables 에 같은 값을 등록합니다.
            </p>
          </div>
        )}
        {configured && loadError && (
          <div className="notice">
            <strong>연락처를 불러오지 못했습니다.</strong>
            <p style={{ margin: "6px 0 0" }}>
              {loadError}
              <br />
              <code>supabase/schema.sql</code> 을 Supabase SQL Editor 에서 실행했는지 확인하세요.
            </p>
          </div>
        )}

        <section className="toolbar" aria-label="검색과 필터">
          <label className="search">
            <span aria-hidden="true">🔍</span>
            <input
              id="search"
              type="search"
              placeholder="이름, 번호, 그룹, 메모 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <span className="hint">초성 검색 가능: ㅎㄱㄷ</span>
          </label>
          <div className="chips" role="group" aria-label="그룹 필터">
            <button
              type="button"
              className="chip"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              전체
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={filter === "fav"}
              onClick={() => setFilter("fav")}
            >
              ★ 즐겨찾기
            </button>
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                className="chip"
                aria-pressed={typeof filter === "object" && filter.group === g}
                onClick={() => setFilter({ group: g })}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section className="list-area">
          <div className="groups">
            {contacts.length === 0 && configured && !loadError && (
              <div className="empty">
                <strong>아직 저장된 연락처가 없습니다</strong>
                오른쪽 위 <b>연락처 추가</b> 를 눌러 첫 번째 번호를 등록하세요.
              </div>
            )}
            {contacts.length > 0 && visible.length === 0 && (
              <div className="empty">
                <strong>검색 결과가 없습니다</strong>
                다른 검색어나 그룹을 선택해 보세요.
              </div>
            )}

            {sections.map(({ letter, items }) => (
              <div className="letter-group" key={letter} id={`idx-${letter}`}>
                <div className="letter-head">{letter}</div>
                <ul className="rows">
                  {items.map((c) => (
                    <li className="row" key={c.id}>
                      <button
                        type="button"
                        className="star"
                        aria-pressed={c.favorite}
                        aria-label={c.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        onClick={() => toggleFavorite(c)}
                      >
                        {c.favorite ? "★" : "☆"}
                      </button>
                      <div className="row-main">
                        <div className="row-name">
                          <span className="name">{c.name}</span>
                          <span className="tag">{c.group_name}</span>
                        </div>
                        <div className="row-phone mono">{c.phone}</div>
                        {c.memo && <div className="row-memo">{c.memo}</div>}
                      </div>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="번호 복사"
                          aria-label="번호 복사"
                          onClick={() => copyPhone(c)}
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon"
                          title="수정"
                          aria-label="수정"
                          onClick={() => setEditing(c)}
                        >
                          ✎
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <nav className="rail" aria-label="초성 색인">
            {INDEX_ORDER.filter((l) => l === "#" || /[ㄱ-ㅎ]/.test(l) || presentLetters.has(l)).map(
              (l) => (
                <a
                  key={l}
                  href={`#idx-${l}`}
                  className={presentLetters.has(l) ? "on" : undefined}
                  aria-disabled={!presentLetters.has(l)}
                  onClick={(e) => {
                    if (!presentLetters.has(l)) e.preventDefault();
                  }}
                >
                  {l}
                </a>
              ),
            )}
          </nav>
        </section>
      </main>

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id}
          contact={editing === "new" ? null : editing}
          groups={groups}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

// ---------- 추가/수정 다이얼로그 ----------
type EditorProps = {
  contact: Contact | null;
  groups: string[];
  onClose: () => void;
  onSave: (input: ContactInput, id?: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
};

function Editor({ contact, groups, onClose, onSave, onDelete }: EditorProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<ContactInput>(
    contact
      ? {
          name: contact.name,
          phone: contact.phone,
          group_name: contact.group_name,
          memo: contact.memo,
          favorite: contact.favorite,
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  function validate(): string | null {
    if (!form.name.trim()) return "이름을 입력하세요.";
    const d = digitsOnly(form.phone);
    if (d.length < 7) return "전화번호는 숫자 7자리 이상이어야 합니다.";
    if (d.length > 11) return "전화번호가 너무 깁니다. (최대 11자리)";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const err = await onSave(form, contact?.id);
    setBusy(false);
    if (err) {
      setError(`저장 실패: ${err}`);
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!contact) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    const err = await onDelete(contact.id);
    setBusy(false);
    if (err) {
      setError(`삭제 실패: ${err}`);
      setConfirmDelete(false);
      return;
    }
    onClose();
  }

  return (
    <dialog className="editor" ref={ref} onClose={onClose} onCancel={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>{contact ? "연락처 수정" : "새 연락처"}</h2>

        <div className="field">
          <label htmlFor="f-name">이름</label>
          <input
            id="f-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="홍길동"
            maxLength={60}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="f-phone">전화번호</label>
          <input
            id="f-phone"
            className="mono"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatPhoneLive(e.target.value) })}
            placeholder="010-1234-5678"
          />
        </div>

        <div className="field">
          <label htmlFor="f-group">그룹</label>
          <input
            id="f-group"
            list="group-options"
            value={form.group_name}
            onChange={(e) => setForm({ ...form, group_name: e.target.value })}
            maxLength={20}
            placeholder="가족, 친구, 직장…"
          />
          <datalist id="group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label htmlFor="f-memo">메모</label>
          <textarea
            id="f-memo"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            maxLength={500}
            placeholder="생일, 회사명, 관계 등"
          />
        </div>

        <label className="check">
          <input
            id="f-fav"
            type="checkbox"
            checked={form.favorite}
            onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
          />
          즐겨찾기에 추가
        </label>

        {error && (
          <div className="field">
            <span className="err" role="alert">
              {error}
            </span>
          </div>
        )}

        <div className="editor-actions">
          {contact && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={busy}
            >
              {confirmDelete ? "정말 삭제할까요? 한 번 더 누르세요" : "삭제"}
            </button>
          )}
          <div className="right">
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
