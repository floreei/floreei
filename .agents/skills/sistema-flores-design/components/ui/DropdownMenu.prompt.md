`DropdownMenu` — menu de ações ancorado a um gatilho; fecha ao clicar fora.

```jsx
<DropdownMenu
  trigger={<Button variant="ghost" size="sm">⋯</Button>}
  items={[
    { label: 'Editar', onClick: edit },
    { separator: true },
    { label: 'Excluir', destructive: true, onClick: remove },
  ]}
/>
```
