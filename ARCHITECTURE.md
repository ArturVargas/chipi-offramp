# Arquitectura del Sistema Chipi Offramp

## Main Modules

### 1. Stellar Account (`src/lib/stellar/account.ts`)
**Responsability**: Create and Manage Stellar Accounts
- Crear nuevas cuentas Stellar
- Fondear cuentas con XLM mínimo
- Establecer trustlines para USDC
- Encriptar claves privadas

**Funciones principales**:
- `createStellarAccountWithTrustline()`: Crea cuenta + trustline USDC

### 2. Stellar Payments (`src/lib/stellar/payments.ts`)
**Responsabilidad**: Send USDC payments on Stellar
- Enviar USDC a cuentas destino
- Manejar memos de transacción
- Gestionar fees de red

**Funciones principales**:
- `sendUSDCToDestination()`: Send USDC with memo

### 3. MoneyGram Auth (`src/lib/moneygram/auth.ts`)
**Responsabilidad**: SEP-10 Auth with MoneyGram
- Autenticación usando la librería oficial
- Manejo de tokens de autenticación
- Configuración de testnet/producción

**Funciones principales**:
- `authenticateWithMoneyGram()`: SEP-10 Auth

### 4. MoneyGram Transactions (`src/lib/moneygram/transactions.ts`)
**Responsabilidad**: SEP-24 Transactions with MoneyGram
- Iniciar transacciones de retiro
- Monitorear estado de transacciones
- Manejar callbacks de estado

**Funciones principales**:
- `initiateMoneyGramWithdrawal()`: Inicia retiro
- `monitorMoneyGramTransaction()`: Monitorea transacción

## Endpoints API

### 1. `/api/stellar/create-account` (POST)
**Propósito**: Crear cuenta Stellar con trustline USDC
```json
{
  "pin": "1234"
}
```

### 2. `/api/moneygram/withdraw` (POST)
**Propósito**: Iniciar retiro con MoneyGram (sin crear cuenta)
```json
{
  "amount": "100",
  "userId": "user123"
}
```

### 3. `/api/moneygram/status` (GET)
**Propósito**: Consultar estado de transacción
```
/api/moneygram/status?transactionId=abc123
```

### 4. `/api/moneygram` (POST)
**Propósito**: Flujo completo (crear cuenta + retiro)
```json
{
  "pin": "1234",
  "amount": "100",
  "userId": "user123"
}
```

## Configuración

### Variables de Entorno Requeridas
```env
# Stellar
STELLAR_FUNDER_SECRET_KEY=your_funder_secret_key

# MoneyGram
MONEYGRAM_AUTH_SECRET_KEY=your_auth_secret_key
MONEYGRAM_FUNDS_SECRET_KEY=your_funds_secret_key
```

### Configuración Centralizada (`src/lib/config.ts`)
- Configuración de Stellar (URLs, USDC, etc.)
- Configuración de MoneyGram (testnet/producción)
- Configuración de la aplicación

## Flujo de Transacción Completo

1. **Crear Cuenta Stellar**
   - Generar keypair
   - Fondear con XLM mínimo
   - Crear trustline USDC
   - Encriptar clave privada

2. **Autenticar con MoneyGram**
   - Autenticación SEP-10
   - Obtener token de autenticación

3. **Iniciar Retiro**
   - Crear transacción SEP-24
   - Obtener ID y URL de transacción

4. **Monitorear Estado**
   - Esperar estado "pending_user_transfer_start"
   - Obtener cuenta destino y memo

5. **Enviar USDC**
   - Enviar USDC a cuenta de MoneyGram
   - Incluir memo requerido

## Beneficios de la Arquitectura

### ✅ Modularidad
- Cada módulo tiene una responsabilidad específica
- Fácil de testear individualmente
- Reutilizable en diferentes contextos

### ✅ Mantenibilidad
- Código limpio y bien documentado
- Separación clara de responsabilidades
- Fácil de debuggear

### ✅ Escalabilidad
- Endpoints específicos para cada funcionalidad
- Configuración centralizada
- Fácil agregar nuevas funcionalidades

### ✅ Flexibilidad
- Puedes usar endpoints individuales o el flujo completo
- Fácil cambiar entre testnet y producción
- Configuración dinámica

## Próximos Pasos

1. **Testing**: Crear tests unitarios para cada módulo
2. **WebSockets**: Implementar monitoreo en tiempo real
3. **Logging**: Agregar sistema de logs estructurado
4. **Métricas**: Implementar métricas de performance
5. **Documentación**: Documentar APIs con OpenAPI/Swagger 