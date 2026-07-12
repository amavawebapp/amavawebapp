import { useRef, useState } from 'react'
import type { ClassGroup } from '../domain/types'
import { CHILD_FIELDS, buildChildFields, type ChildInput } from '../domain/child-fields'
import { Avatar, Icon, StoredImage } from './ui'
import { useOnlineStatus } from '../hooks/use-online-status'
import { compressImage, isAcceptableUpload } from '../lib/image'
import { randomPath, uploadFile } from '../lib/storage'

interface Props {
  classes: ClassGroup[]
  allowClassChange: boolean
  initial?: Partial<{ classId: string; firstName: string; surname: string; dateStarted: string; isSample: boolean; fields: Record<string, string>; photoPath: string | null; indemnityPath: string | null }>
  onSubmit: (input: ChildInput) => void
  onCancel: () => void
  heading?: string
}

export function ChildEditor({ classes, allowClassChange, initial, onSubmit, onCancel, heading = 'Add a child' }: Props) {
  const online = useOnlineStatus()
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [surname, setSurname] = useState(initial?.surname ?? '')
  const [classId, setClassId] = useState(initial?.classId ?? classes[0]?.id ?? '')
  const [dateStarted, setDateStarted] = useState(initial?.dateStarted ?? new Date().toISOString().slice(0, 10))
  const [isSample, setIsSample] = useState(initial?.isSample ?? true)
  const [fieldVals, setFieldVals] = useState<Record<string, string>>(initial?.fields ?? {})

  // undefined = leave stored path unchanged; null = clear; string = new path.
  const [photoPath, setPhotoPath] = useState<string | null | undefined>(initial?.photoPath ?? undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null) // local object-URL for instant preview
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoErr, setPhotoErr] = useState<string | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  const [indemnityPath, setIndemnityPath] = useState<string | null | undefined>(initial?.indemnityPath ?? undefined)
  const [indemnityBusy, setIndemnityBusy] = useState(false)
  const [indemnityErr, setIndemnityErr] = useState<string | null>(null)
  const indemnityInput = useRef<HTMLInputElement>(null)

  const valid = firstName.trim() !== '' && surname.trim() !== '' && classId !== ''
  // Whether a photo is currently shown (preview, new, or existing-and-not-cleared).
  const hasPhoto = photoPreview !== null || (photoPath !== null && (photoPath !== undefined || (initial?.photoPath ?? null) !== null))
  const hasIndemnity = indemnityPath !== null && (indemnityPath !== undefined || (initial?.indemnityPath ?? null) !== null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoErr(null)
    const check = isAcceptableUpload(file)
    if (!check.ok || !file.type.startsWith('image/')) {
      setPhotoErr(check.error ?? 'Please choose an image.')
      return
    }
    setPhotoBusy(true)
    try {
      const blob = await compressImage(file)
      const path = randomPath('photo', file.name)
      await uploadFile('child-photos', path, blob, 'image/jpeg')
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoPreview(URL.createObjectURL(blob))
      setPhotoPath(path)
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setPhotoBusy(false)
    }
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoPath(null)
    setPhotoErr(null)
  }

  async function handleIndemnity(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIndemnityErr(null)
    const check = isAcceptableUpload(file)
    if (!check.ok) {
      setIndemnityErr(check.error ?? 'Please choose an image or PDF.')
      return
    }
    setIndemnityBusy(true)
    try {
      const isImage = file.type.startsWith('image/')
      const blob = isImage ? await compressImage(file) : file
      const contentType = isImage ? 'image/jpeg' : (file.type || 'application/pdf')
      const path = randomPath('indemnity', file.name)
      await uploadFile('child-docs', path, blob, contentType)
      setIndemnityPath(path)
    } catch (err) {
      setIndemnityErr(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIndemnityBusy(false)
    }
  }

  function submit() {
    const payload: ChildInput = {
      classId, firstName: firstName.trim(), surname: surname.trim(), dateStarted, isSample, fields: buildChildFields(fieldVals),
    }
    if (photoPath !== undefined) payload.photoPath = photoPath
    if (indemnityPath !== undefined) payload.indemnityPath = indemnityPath
    onSubmit(payload)
  }

  const fullName = `${firstName} ${surname}`.trim() || 'New child'

  return (
    <div className="am-scrim" onClick={onCancel}>
      <div className="am-sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="am-sheet__grip" />
        <div className="am-sheet__head">
          <div className="am-ava" style={{ background: 'var(--brand)', width: 40, height: 40, flexBasis: 40, borderRadius: 12 }}>
            <Icon name="plus" size={22} color="#fff" />
          </div>
          <div className="am-h2">{heading}</div>
          <button className="am-sheet__x" onClick={onCancel} aria-label="Close">×</button>
        </div>

        <div className="am-stack" style={{ gap: 16 }}>
          {/* photo picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {photoPreview
              ? <img src={photoPreview} alt="child photo" style={{ width: 64, height: 64, flex: '0 0 64px', borderRadius: 32, objectFit: 'cover', display: 'block' }} />
              : (photoPath !== null && (photoPath ?? initial?.photoPath))
                ? <StoredImage bucket="child-photos" path={photoPath ?? initial?.photoPath} alt="child photo" size={64} fallback={<Avatar name={fullName} size={64} />} />
                : <Avatar name={fullName} size={64} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} aria-label="child photo file" />
              <button type="button" className="am-btn am-btn--ghost" style={{ padding: '8px 14px' }}
                disabled={!online || photoBusy} onClick={() => photoInput.current?.click()}>
                <Icon name="plus" size={18} /> {photoBusy ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Add photo'}
              </button>
              {hasPhoto && !photoBusy && (
                <button type="button" className="am-btn am-btn--ghost" style={{ padding: '8px 14px', marginLeft: 8 }} onClick={removePhoto}>Remove photo</button>
              )}
              {!online && <div className="am-muted" style={{ fontSize: '.82rem', marginTop: 6 }}>Connect to the internet to add a photo.</div>}
              {photoErr && <div style={{ color: 'var(--warn)', fontSize: '.82rem', marginTop: 6, fontWeight: 700 }}>{photoErr}</div>}
            </div>
          </div>

          <label className="am-field">
            <span className="am-field__lab">First name</span>
            <input className="am-input" aria-label="first name" placeholder="e.g. Aphiwe" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
          </label>
          <label className="am-field">
            <span className="am-field__lab">Surname</span>
            <input className="am-input" aria-label="surname" placeholder="e.g. Mbeki" value={surname} onChange={e => setSurname(e.target.value)} />
          </label>

          {allowClassChange && (
            <div className="am-field">
              <span className="am-field__lab">Class</span>
              <div className="am-hscroll">
                {classes.map(c => {
                  const on = classId === c.id
                  return (
                    <button key={c.id} type="button" className={'am-chip' + (on ? ' am-chip--on' : '')} aria-pressed={on} onClick={() => setClassId(c.id)}>
                      <span className="am-chip__dot" style={{ background: on ? '#fff' : 'var(--brand)' }} />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {CHILD_FIELDS.map(f => (
            <label key={f.key} className="am-field">
              <span className="am-field__lab">{f.label}</span>
              <input className="am-input" aria-label={f.label} type={f.type === 'date' ? 'date' : 'text'}
                value={fieldVals[f.key] ?? ''} onChange={e => setFieldVals(v => ({ ...v, [f.key]: e.target.value }))} />
            </label>
          ))}

          <div className="am-ctrl">
            <div style={{ flex: 1 }}>
              <div className="am-ctrl__lab">Part of the research sample</div>
              <div className="am-ctrl__sub">Their scores will count in impact reports.</div>
            </div>
            <button className={'am-switch' + (isSample ? ' on' : '')} role="switch" aria-checked={isSample}
              aria-label="Part of the research sample" onClick={() => setIsSample(s => !s)}>
              <span className="am-switch__knob" />
            </button>
          </div>

          <label className="am-field">
            <span className="am-field__lab">Start date</span>
            <input className="am-input" aria-label="start date" type="date" value={dateStarted} onChange={e => setDateStarted(e.target.value)} />
          </label>

          {/* indemnity form */}
          <div className="am-field">
            <span className="am-field__lab">Indemnity form</span>
            <input ref={indemnityInput} type="file" accept="image/*,application/pdf" onChange={handleIndemnity} style={{ display: 'none' }} aria-label="indemnity form file" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {hasIndemnity && !indemnityBusy && (
                <span className="am-chip" style={{ background: 'var(--good-soft)', color: 'var(--good)', borderColor: 'transparent' }}>Attached ✓</span>
              )}
              <button type="button" className="am-btn am-btn--ghost" style={{ padding: '8px 14px' }}
                disabled={!online || indemnityBusy} onClick={() => indemnityInput.current?.click()}>
                <Icon name="plus" size={18} /> {indemnityBusy ? 'Uploading…' : hasIndemnity ? 'Replace' : 'Upload'}
              </button>
              {hasIndemnity && !indemnityBusy && (
                <button type="button" className="am-btn am-btn--ghost" style={{ padding: '8px 14px' }} onClick={() => { setIndemnityPath(null); setIndemnityErr(null) }}>Remove</button>
              )}
            </div>
            {!online && <div className="am-muted" style={{ fontSize: '.82rem', marginTop: 6 }}>Connect to the internet to upload the form.</div>}
            {indemnityErr && <div style={{ color: 'var(--warn)', fontSize: '.82rem', marginTop: 6, fontWeight: 700 }}>{indemnityErr}</div>}
          </div>

          <button className="am-btn am-btn--primary am-btn--block am-btn--lg" disabled={!valid} onClick={submit}>
            <Icon name="check" size={20} stroke={3} /> {heading === 'Add a child' ? 'Add child' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
