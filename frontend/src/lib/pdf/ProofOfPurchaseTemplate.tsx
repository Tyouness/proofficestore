/**
 * Template PDF pour la Preuve d'Achat AllKeyMasters
 * ❌ Document NON FISCAL (pas une facture)
 * ✅ Simple preuve d'achat pour le client
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Types pour les données de la commande
interface OrderItem {
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ProofOfPurchaseData {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  paymentMethod: string;
  items: OrderItem[];
  totalAmount: number;
}

// Styles épurés et professionnels
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000000',
    paddingBottom: 15,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nonFiscalLabel: {
    fontSize: 9,
    color: '#666666',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 150,
    fontWeight: 'bold',
    color: '#333333',
  },
  infoValue: {
    flex: 1,
    color: '#000000',
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontWeight: 'bold',
    borderBottom: '1 solid #000000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #E5E7EB',
  },
  colProduct: {
    width: '40%',
  },
  colVariant: {
    width: '20%',
  },
  colQty: {
    width: '10%',
    textAlign: 'center',
  },
  colUnitPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '2 solid #000000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  importantBox: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 4,
    border: '1 solid #F59E0B',
  },
  importantTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400E',
  },
  importantText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #E5E7EB',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 3,
  },
  contactText: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
});

export const ProofOfPurchaseTemplate: React.FC<{ data: ProofOfPurchaseData }> = ({ data }) => {
  const formatPrice = (price: number): string => {
    return `${price.toFixed(2)} €`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.logoText}>AllKeyMasters</Text>
          <Text style={styles.nonFiscalLabel}>
            Document non fiscal – Preuve d&apos;achat
          </Text>
        </View>

        {/* Informations commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de commande</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Numéro de commande :</Text>
            <Text style={styles.infoValue}>{data.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date et heure de paiement :</Text>
            <Text style={styles.infoValue}>{formatDate(data.orderDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email client :</Text>
            <Text style={styles.infoValue}>{data.customerEmail}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Moyen de paiement :</Text>
            <Text style={styles.infoValue}>{data.paymentMethod}</Text>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif de la commande</Text>
          <View style={styles.table}>
            {/* En-tête tableau */}
            <View style={styles.tableHeader}>
              <Text style={styles.colProduct}>Produit</Text>
              <Text style={styles.colVariant}>Variante</Text>
              <Text style={styles.colQty}>Qté</Text>
              <Text style={styles.colUnitPrice}>Prix unit. TTC</Text>
              <Text style={styles.colTotal}>Total TTC</Text>
            </View>

            {/* Lignes produits */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colProduct}>{item.product_name}</Text>
                <Text style={styles.colVariant}>{item.variant_name || '-'}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnitPrice}>{formatPrice(item.unit_price)}</Text>
                <Text style={styles.colTotal}>{formatPrice(item.total_price)}</Text>
              </View>
            ))}
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total payé TTC :</Text>
              <Text style={styles.totalAmount}>{formatPrice(data.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Encadré important - Clé de licence */}
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>
            ⚠️ Accès à votre clé de licence
          </Text>
          <Text style={styles.importantText}>
            Votre clé de licence est disponible dans votre espace client AllKeyMasters.
            {'\n'}
            Connectez-vous sur allkeymasters.com pour accéder à vos licences et les télécharger.
          </Text>
        </View>

        {/* Contact support */}
        <View style={styles.section}>
          <Text style={styles.contactText}>
            Besoin d&apos;aide ? Contactez notre support : contact@allkeymasters.com
          </Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Merci pour votre confiance
          </Text>
          <Text style={styles.footerText}>
            allkeymasters.com
          </Text>
          <Text style={styles.footerText}>
            Document généré le {new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })} à {new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
